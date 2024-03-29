import dayjs from "dayjs"
import { getBigQuery } from "./bigquery"
import { datasetId, googleProjectId, nelsonApiKey, nelsonApiRoot } from "./env"
import { Reservation, ReservationWithGuests, WaitingReservation } from "./reservation"
import { splitToChunks, timestampFormat } from "./utils"
import fetch from "node-fetch"

/**
 * Fetches new waiting reservations
 */
export const fetchWaitingReservations = async () => {
  try {
    const bq = getBigQuery(googleProjectId)
    const latestReservation = await bq.queryOne<{ updated: string }>(datasetId, "SELECT MAX(updated) as updated FROM reservations")
    if (latestReservation) {
      const latestUpdated = latestReservation.updated ? dayjs(latestReservation.updated).format(timestampFormat) : dayjs().subtract(10, "years").format(timestampFormat)
      const waitingReservations = await bq.query<WaitingReservation>(datasetId, `SELECT * FROM waitingReservations WHERE updated>TIMESTAMP('${latestUpdated}') ORDER BY updated ASC`)

      const updateTimestamps = waitingReservations.reduce((all, wr) => { all[wr.id] = dayjs(wr.updated).format(timestampFormat); return all }, {} as { [id: number]: string })

      const waitingReservationIds = waitingReservations.map(r => r.id)
      const filteredWaiting = waitingReservationIds.reduce((all, current) => all.indexOf(current) !== -1 ? all : all.concat(current), [] as number[])

      console.log(`Found ${filteredWaiting.length} waiting reservations`)
      const chunks = splitToChunks(20, filteredWaiting)

      console.log(`Split to ${chunks.length} chunks`)
      for (const chunk of chunks) {
        console.log('Fetching chunk reservations from Nelson')
        const response = await fetch(`${nelsonApiRoot}/api/cdp/reservation?secretKey=${nelsonApiKey}&reservationIds=${chunk.join(",")}`)
        if (chunk.length > 0 && response.status === 200) {
          console.log('Fetching succeeded')
          const reservationsWithGuests: ReservationWithGuests[] = ((await response.json()) as any).reservations
          const reservations = reservationsWithGuests.map(rg => {
            const rgNew = JSON.parse(JSON.stringify(rg))
            rgNew.updated = updateTimestamps[rgNew.id]
            delete (rgNew.guests)
            if (typeof rgNew.cancelled === "string") {
              rgNew.cancelled = true
            }
            rgNew.created = dayjs(rgNew.created).format("YYYY-MM-DD HH:mm:ss")
            rgNew.confirmed = dayjs(rgNew.confirmed).format("YYYY-MM-DD HH:mm:ss")
            rgNew.checkIn = dayjs(rgNew.checkIn).format("YYYY-MM-DD HH:mm:ss")
            rgNew.checkOut = dayjs(rgNew.checkOut).format("YYYY-MM-DD HH:mm:ss")
            rgNew.totalPaid = parseFloat(rgNew.totalPaid.replace("EUR ", ""))
            rgNew.totalPaidExtraForOTA = parseFloat(rgNew.totalPaid)
            rgNew.type = 0
            return rgNew as Reservation
          })
          const rids = reservationsWithGuests.map(r => r.id)
          const guests = reservationsWithGuests.map(r => r.guests.map(g => ({ ...g, reservationId: r.id }))).flat().map((g, i) => {
            delete ((g as any).completedCheckInOnline)
            delete ((g as any).completedCheckIn)
            delete ((g as any).address)
            delete ((g as any).idUploaded)
            delete ((g as any).signed)
            g.guestIndex = (g as any).index
            delete ((g as any).index)
            return g
          })

          const guestIds = guests.map(g => g.id)
          await bq.delete(datasetId, `DELETE FROM guests WHERE id IN (${guestIds.join(',')})`)
          await bq.delete(datasetId, `DELETE FROM reservations WHERE id IN (${rids.join(',')})`)

          try {
            await bq.insert(datasetId, "guests", guests)
          } catch (insertErrors: any) {
            if (!insertErrors.errors[0]?.errors) {
              throw insertErrors
            }
            const invalidGuestIds = insertErrors.errors.filter((error: any) => {
              return error.errors.find((e: any) => e.reason !== "stopped")
            }).map((error: any) => error.row.id)
            const validGuests = guests.filter(g => invalidGuestIds.indexOf(g.id) === -1)
            await bq.insert(datasetId, "guests", validGuests)
            console.warn(`Found ${validGuests.length} valid guests and ${invalidGuestIds.length} invalid guests. Total ${guests.length}.`)
          }

          try {
            await bq.insert(datasetId, "reservations", reservations)
          } catch (insertErrors: any) {
            if (!insertErrors.errors[0]?.errors) {
              throw insertErrors
            }
            const invalidReservationIds = insertErrors.errors.filter((error: any) => {
              return error.errors.find((e: any) => e.reason !== "stopped")
            }).map((error: any) => error.row.id)
            const validReservations = reservations.filter(r => invalidReservationIds.indexOf(r.id) === -1)
            await bq.insert(datasetId, "reservations", validReservations)
            console.warn(`Found ${validReservations.length} valid reservations and ${invalidReservationIds.length} invalid reservations. Total ${reservations.length}.`)
          }
        } else if (chunk.length > 0) {
          console.error(`Fetching failed with status ${response.status}.`)
          console.error(await response.text())
          throw Error(response.statusText)
        }
      }
    }
  }
  catch (error) {
    console.error('Fetching reservations failed')
    console.error(error)
    console.error(JSON.stringify(error, null, 2))
  }
}