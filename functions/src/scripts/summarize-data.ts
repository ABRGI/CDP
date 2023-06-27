import dayjs from "dayjs"
import { Guest, mapGuestValue } from "../guest"
import { CustomerMerger } from "../merge"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv, streamCsv } from "../utils"


const summarizeData = async (reservationFilename: string, guestFilename: string): Promise<void> => {
  const merger = new CustomerMerger()

  console.log("Starting reservations...")
  let nonReservationCustomers = 0
  let identifiedReservationCustomers = 0
  let handled = 0
  let time = new Date().getTime()

  await streamCsv<Reservation>(reservationFilename, (r: Reservation) => {
    if (!r.customerEmailReal && !r.customerMobile && !r.customerSsn) {
      nonReservationCustomers++
    } else {
      identifiedReservationCustomers++
    }
    if (dayjs(r.checkIn).isValid() && r.customerEmailReal?.indexOf("@") !== -1) {
      merger.addReservation(r)
      handled++
      if ((handled % 10000) === 0) {
        console.log(`Handled ${Math.round(handled * 100 / 1000000)}% of reservations in seconds ${(new Date().getTime() - time) / 1000.0}`)
      }
    }
  }, mapReservationValue)

  console.log("Starting guests...")
  let nonCustomerGuests = 0
  let customerGuests = 0
  handled = 0
  await streamCsv<Guest>(guestFilename, (g: Guest) => {
    if (!g.email && !g.mobile && !g.ssn) {
      nonCustomerGuests++
    } else {
      customerGuests++
    }
    handled++
    merger.addGuest(g)
    if ((handled % 100000) === 0) {
      console.log(`Handled ${Math.round(handled * 100 / 1000000)}% of guests`)
    }
  }, mapGuestValue)

  console.log(`Identified reservation customers: ${identifiedReservationCustomers}, unidentified reservation: ${nonReservationCustomers}`)
  console.log(`Identified guest customers: ${customerGuests}, unidentified guests: ${nonCustomerGuests}`)

  const customers = merger.getCustomers()
  console.log(`Total customer profiles: ${customers.length}`)
  console.log(`Total bookings: ${customers.reduce((t, c) => t + c.totalBookings, 0)}`)
}

summarizeData('reservations-test-data.csv', 'guests-test-data.csv').then(() => {
  console.log("Done")
}).catch((error) => {
  console.log(error)
})