import dayjs from "dayjs"
import { BigQuerySimple } from "./bigquery"
import { datasetId, googleProjectId } from "./env"
import { WaitingReservation } from "./reservation"
import { generateNewGuest, generateNewReservation } from "./test/utils"
import { timestampFormat } from "./utils"

const bq = new BigQuerySimple(googleProjectId)


/**
 * Fetches new waiting reservations
 */
export const fetchWaitingReservations = async () => {
  const latestReservation = await bq.queryOne<{ updated: string }>(datasetId, "SELECT MAX(updated) as updated FROM reservations")
  if (latestReservation) {
    const latestUpdated = dayjs(latestReservation.updated).format(timestampFormat)
    const waitingReservations = await bq.query<WaitingReservation>(datasetId, `SELECT * FROM waitingReservations WHERE updated>TIMESTAMP('${latestUpdated}') ORDER BY updated ASC`)
    console.log(`Found ${waitingReservations.length} waiting reservations`)
    for (const waiting of waitingReservations) {
      // Mock fetching from Nelson
      const reservation = generateNewReservation()
      reservation.id = waiting.id
      reservation.updated = dayjs(waiting.updated).format(timestampFormat)
      await bq.insertOne(datasetId, "reservations", reservation)
    }
  }
}