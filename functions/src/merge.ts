import { Customer } from "./customer"
import { Guest, addGuestToCustomer, createCustomerFromGuest, mergeGuestToCustomer } from "./guest"
import { Reservation, createCustomerFromReservation, mergeReservationToCustomer } from "./reservation"


/**
 * Class for creating customer profiles from stream of reservations and guest information.
 * It is assumed that reservations are given ordered by the reservation ID.
 */
export class CustomerMerger {
  emailIds: { [email: string]: string } = {}
  ssnIds: { [ssn: string]: string } = {}
  phoneNumberIds: { [phoneNumber: string]: string } = {}
  customers: { [id: string]: Customer } = {}
  reservations: { [id: string]: Reservation } = {}
  reservationCustomerId: { [reservationId: string]: string } = {}

  /**
   * Add reservation information to the customer profiles or creates a new one
   * @param r Reservation to add
   */
  addReservation(r: Reservation) {
    this.reservations[r.id] = r
    const customerId = this.getExistingCustomer(r.customerSsn, r.customerEmailReal, r.customerMobile)
    if (customerId) {
      this.reservationCustomerId[r.id] = customerId
      this.customers[customerId] = mergeReservationToCustomer(this.customers[customerId], r)
    } else {
      const customer = createCustomerFromReservation(r)
      if (customer) {
        this.customers[customer.id] = customer
        this.reservationCustomerId[r.id] = customer.id
      }
    }
  }

  /**
   * Add guest information to the customer profiles or creates a new one
   * @param g Guest to add
   */
  addGuest(g: Guest) {
    // Handling the guest customer profile
    const customerId = this.getExistingCustomer(g.ssn, g.email, g.mobile)
    if (customerId) {
      this.reservationCustomerId[g.id] = customerId
      this.customers[customerId] = mergeGuestToCustomer(this.customers[customerId], this.reservations[g.reservationId], g)
    } else {
      const customer = createCustomerFromGuest(this.reservations[g.reservationId], g)
      if (customer) {
        this.customers[customer.id] = customer
      }
    }

    // Add the guest information to the booking customer
    const reservationCustomerId = this.reservationCustomerId[g.reservationId]
    if (reservationCustomerId) {
      const customer = this.customers[reservationCustomerId]
      if (customer) {
        this.customers[reservationCustomerId] = addGuestToCustomer(customer, g)
      }
    }
  }

  /**
   * Check if there is customer with any of the given parameters
   * @param ssn Social Security Number
   * @param email email
   * @param phoneNumber phone number
   * @returns customer ID if one is found, undefined otherwise
   */
  getExistingCustomer(ssn?: string, email?: string, phoneNumber?: string): string | undefined {
    if (ssn && this.ssnIds[ssn]) {
      return this.ssnIds[ssn]
    }
    if (email && this.emailIds) {
      return this.emailIds[email]
    }
    if (phoneNumber && this.phoneNumberIds[phoneNumber]) {
      return this.phoneNumberIds[phoneNumber]
    }
    return
  }
}
