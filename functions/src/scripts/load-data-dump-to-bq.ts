import dayjs from "dayjs"
import { CustomerMerger } from "../merge"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv } from "../utils"
import { Guest, mapGuestValue } from "../guest"
import { getBigQuery } from "../bigquery"

const loadDataToBigQuery = async (projectId: string, datasetId: string,
  reservationFilename: string, guestFilename: string): Promise<void> => {

  const bq = getBigQuery(projectId)

  process.stdout.write("Loading reservations...")
  const rawReservations = await loadCsv<Reservation>(reservationFilename, mapReservationValue)
  const reservations = rawReservations.filter(a => dayjs(a.checkIn).isValid()).sort((a, b) => a.id - b.id)
  process.stdout.write("done.\n")

  const merger = new CustomerMerger()

  process.stdout.write("Merging reservations...")
  for (const r of reservations) {
    merger.addReservation(r)
  }
  process.stdout.write("done.\n")

  process.stdout.write("Loading guests...")
  const rawGuests = await loadCsv<Guest>(guestFilename, mapGuestValue)
  const guests = rawGuests.sort((a, b) => a.reservationId - b.reservationId)
  process.stdout.write("done.\n")

  process.stdout.write("Merging guests...")
  for (const g of guests) {
    merger.addGuest(g)
  }
  process.stdout.write("done.\n")

  process.stdout.write("Inserting reservations to BigQuery...")
  // await bq.insert(datasetId, "reservations", reservations)
  process.stdout.write("done.\n")

  process.stdout.write("Inserting guests to BigQuery...")
  //await bq.insert(datasetId, "guests", guests)
  process.stdout.write("done.\n")

  const customers = merger.getCustomers()
  process.stdout.write("Inserting customers to BigQuery...")
  await bq.insert(datasetId, "customers", customers)
  process.stdout.write("done.\n")

  console.log(`Found ${reservations.length} reservations, ${guests.length} guests and created ${customers.length} customer profiles`)
}

if (process.argv.length < 6) {
  console.log("Usage: ts-node load-data-dump-to-bq.ts <target_project_id> <target_dataset_id> <reservations>.csv <guests>.csv")
  process.exit(0)
} else {
  loadDataToBigQuery(process.argv[2], process.argv[3], process.argv[4], process.argv[5]).then(() => {
    console.log("All done.")
  }).catch((error) => {
    console.log(JSON.stringify(error, null, 2))
    console.log(error)
  })
}
