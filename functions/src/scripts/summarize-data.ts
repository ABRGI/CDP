import { Guest, mapGuestValue } from "../guest"
import { CustomerMerger } from "../merge"
import { Reservation, mapReservationValue } from "../reservation"
import { loadCsv } from "../utils"


const summarizeData = async (reservationFilename: string, guestFilename: string): Promise<void> => {
  const rawReservations = await loadCsv<Reservation>(reservationFilename, mapReservationValue)
  const reservations = rawReservations.sort((a, b) => b.id - a.id)
  const merger = new CustomerMerger()

  let nonReservationCustomers = 0
  let identifiedReservationCustomers = 0
  for (const r of reservations) {
    if (!r.customerEmailReal && !r.customerMobile && !r.customerSsn) {
      nonReservationCustomers++
    } else {
      identifiedReservationCustomers++
    }
    merger.addReservation(r)
  }

  const rawGuests = await loadCsv<Guest>(guestFilename, mapGuestValue)
  const guests = rawGuests.sort((a, b) => b.reservationId - a.reservationId)
  let nonCustomerGuests = 0
  let customerGuests = 0
  for (const g of guests) {
    if (!g.email && !g.mobile && !g.ssn) {
      nonCustomerGuests++
    } else {
      customerGuests++
    }
    merger.addGuest(g)
  }

  console.log(`Identified reservation customers: ${identifiedReservationCustomers}, unidentified reservation: ${nonReservationCustomers}`)
  console.log(`Identified guest customers: ${customerGuests}, unidentified guests: ${nonCustomerGuests}`)

  const customers = merger.getCustomers()
  console.log(`Total customer profiles: ${customers.length}`)
  console.log(`Total bookings: ${customers.reduce((t, c) => t + c.totalBookings, 0)}`)

  for (const guest of guests) {
    console.log((guest.ssn || "").padEnd(30, " ") + " " +
      (guest.mobile || "").padEnd(30, " ") + " " +
      (guest.email || "").padEnd(60, " "))
  }
}

summarizeData('test-data/reservations_sample_05312023.csv', 'test-data/guest_sample_05312023.csv').then(() => {
  console.log("Done")
}).catch((error) => {
  console.log(`Error occurred ${error}`)
})