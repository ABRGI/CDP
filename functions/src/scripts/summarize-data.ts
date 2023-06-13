import dayjs from "dayjs"
import { Guest, mapGuestValue } from "../guest"
import { CustomerMerger } from "../merge"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv } from "../utils"


const summarizeData = async (reservationFilename: string, guestFilename: string): Promise<void> => {
  const rawReservations = await loadCsv<Reservation>(reservationFilename, mapReservationValue)
  const reservations = rawReservations.filter(a => dayjs(a.checkIn).isValid()).sort((a, b) => b.id - a.id)
  const merger = new CustomerMerger()

  console.log("Starting reservations...")
  let nonReservationCustomers = 0
  let identifiedReservationCustomers = 0
  let handled = 0
  for (const r of reservations) {
    if (!r.customerEmailReal && !r.customerMobile && !r.customerSsn) {
      nonReservationCustomers++
    } else {
      identifiedReservationCustomers++
    }
    merger.addReservation(r)
    handled++
    if ((handled % 100000) === 0) {
      console.log(`Handled ${Math.round(handled * 100 / reservations.length)}% of reservations`)
    }
  }

  const rawGuests = await loadCsv<Guest>(guestFilename, mapGuestValue)
  const guests = rawGuests.sort((a, b) => b.reservationId - a.reservationId)
  let nonCustomerGuests = 0
  let customerGuests = 0

  console.log("Starting guests...")

  handled = 0
  for (const g of guests) {
    if (!g.email && !g.mobile && !g.ssn) {
      nonCustomerGuests++
    } else {
      customerGuests++
    }
    handled++
    merger.addGuest(g)
    if ((handled % 100000) === 0) {
      console.log(`Handled ${Math.round(handled * 100 / reservations.length)}% of guests`)
    }
  }

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