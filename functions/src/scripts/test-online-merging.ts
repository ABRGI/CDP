import dayjs from "dayjs"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv } from "../utils"
import { Guest, mapGuestValue } from "../guest"
import { getBigQuery } from "../bigquery"
import { OnlineMerger } from "../onlineMerge"

const testOnlineMerger = async (projectId: string, datasetId: string,
  reservationFilename: string, guestFilename: string): Promise<void> => {

  const bq = getBigQuery(projectId)

  // Load reservations to BigQuery
  process.stdout.write("Loading reservations...")
  const rawReservations = await loadCsv<Reservation>(reservationFilename, mapReservationValue, { updated: dayjs().format('YYYY-MM-DDTHH:mm:ss.sss') })
  const reservations = rawReservations.filter(a => dayjs(a.checkIn).isValid()).sort((a, b) => a.id - b.id)
  process.stdout.write("done.\n")

  process.stdout.write("Inserting reservations to BigQuery...")
  await bq.insert(datasetId, "reservations", reservations)
  process.stdout.write("done.\n")

  // Load guests to BigQuery
  process.stdout.write("Loading guests...")
  const rawGuests = await loadCsv<Guest>(guestFilename, mapGuestValue)
  const guests = rawGuests.sort((a, b) => a.reservationId - b.reservationId)
  process.stdout.write("done.\n")

  console.log(`Found ${reservations.length} reservations, ${guests.length} guests`)

  process.stdout.write("Inserting guests to BigQuery...")
  await bq.insert(datasetId, "guests", guests)
  process.stdout.write("done.\n")

  process.stdout.write("Merging reservations to customers to BigQuery...\n")
  const merger = new OnlineMerger(projectId, datasetId, true)

  const stats = await merger.mergeNewReservations()
  console.log(`New reservations: ${stats.newReservations}, new guests: ${stats.newGuests}, new profiles: ${stats.newProfiles}, updated profiles: ${stats.updatedProfiles}`)

}

if (process.argv.length < 6) {
  console.log("Usage: ts-node test-online-merging.ts <target_project_id> <target_dataset_id> <reservations>.csv <guests>.csv")
  process.exit(0)
} else {
  testOnlineMerger(process.argv[2], process.argv[3], process.argv[4], process.argv[5]).then(() => {
    console.log("All done.")
  }).catch((error) => {
    console.log(JSON.stringify(error, null, 2))
    console.log(error)
  })
}
