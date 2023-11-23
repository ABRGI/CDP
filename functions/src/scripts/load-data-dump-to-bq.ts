import dayjs from "dayjs"
import { CustomerMerger } from "../merge"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv, timestampFormat } from "../utils"
import { Guest, mapGuestValue } from "../guest"
import { getBigQuery } from "../bigquery"
import { Voucher, mapVoucherValue, mapVouchersToReservations } from "../voucher"
import { Price, mapPriceValue, mapPricesToReservations } from "../price"

const loadDataToBigQuery = async (projectId: string, datasetId: string, latestUpdateTimestamp: string,
  reservationFilename: string, guestFilename: string, voucherFilename: string, priceFilename: string): Promise<void> => {

  const bq = getBigQuery(projectId)

  process.stdout.write("Loading vouchers...")
  const vouchers = await loadCsv<Voucher>(voucherFilename, mapVoucherValue)
  const voucherMap = mapVouchersToReservations(vouchers)
  process.stdout.write("done.\n")

  process.stdout.write("Loading prices...")
  const prices = await loadCsv<Price>(priceFilename, mapPriceValue)
  const pricesMap = mapPricesToReservations(prices)
  process.stdout.write("done.\n")

  process.stdout.write("Loading reservations...")
  const rawReservations = await loadCsv<Reservation>(reservationFilename, mapReservationValue, { updated: dayjs().format(latestUpdateTimestamp), voucherKeys: [] })
  const reservations = rawReservations.sort((a, b) => a.id - b.id)
    .map(r => ({ ...r, totalPaid: pricesMap[r.id] ? pricesMap[r.id].totalPrice : 0.0, voucherKeys: (voucherMap[r.id] || []).map(v => v.voucherKey) }))
  process.stdout.write("done.\n")

  process.stdout.write("Inserting reservations to BigQuery...")
  await bq.insert(datasetId, "reservations", reservations)
  process.stdout.write("done.\n")

  process.stdout.write("Loading guests...")
  const rawGuests = await loadCsv<Guest>(guestFilename, mapGuestValue)
  const guests = rawGuests.sort((a, b) => a.reservationId - b.reservationId)
  process.stdout.write("done.\n")

  process.stdout.write("Inserting guests to BigQuery...")
  await bq.insert(datasetId, "guests", guests)
  process.stdout.write("done.\n")

  const merger = new CustomerMerger()

  process.stdout.clearLine(0);
  process.stdout.write("Merging reservations...")
  let index = 0
  for (const r of reservations) {
    if (!(index % 1000)) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Merging reservations...${Math.round(index * 1000 / reservations.length) / 10.0}%`);
    }
    merger.addReservation(r)
    index++
  }
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write("Merging reservations...done.\n")

  process.stdout.write("Merging guests...")
  index = 0
  for (const g of guests) {
    if (!(index % 1000)) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`Merging guests...${Math.round(index * 1000 / guests.length) / 10.0}%`);
    }
    merger.addGuest(g)
    index++
  }
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write("Merging guests...done.\n")

  const customers = merger.getCustomers()
  process.stdout.write(`Created ${customers.length} customer profiles.\n`)

  process.stdout.write("Inserting customers to BigQuery...")
  await bq.insert(datasetId, "customers", customers)
  process.stdout.write("done.\n")

  console.log(`Found ${reservations.length} reservations, ${guests.length} guests and created ${customers.length} customer profiles`)
}

if (process.argv.length < 8) {
  console.log("Usage: ts-node load-data-dump-to-bq.ts <target_project_id> <target_dataset_id> <latest_update_timestamp> <reservations>.csv <guests>.csv <vouchers>.csv <price>.csv")
  process.exit(0)
} else {
  loadDataToBigQuery(process.argv[2], process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7], process.argv[8]).then(() => {
    console.log("All done.")
  }).catch((error) => {
    console.log(JSON.stringify(error, null, 2))
    console.log(error)
  })
}
