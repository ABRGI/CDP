import { Customer } from "./customer"
import { Guest, createCustomerFromGuest } from "./guest"
import { Reservation, createCustomerFromReservation } from "./reservation"


export class CustomerMerger {
  emailIds: { [email: string]: string } = {}
  ssnIds: { [ssn: string]: string } = {}
  phoneNumberIds: { [phoneNumber: string]: string } = {}
  customers: { [id: string]: Customer } = {}
  reservations: { [id: string]: Reservation } = {}
  reservationCustomerId: { [reservationId: string]: string } = {}

  addReservation(r: Reservation) {
    this.reservations[r.id] = r
    const customerId = this.getExistingCustomer(r.customerSsn, r.customerEmailReal, r.customerMobile)
    if (customerId) {
      this.reservationCustomerId[r.id] = customerId

    } else {
      const customer = createCustomerFromReservation(r)
      if (customer) {
        this.customers[customer.id] = customer
        this.reservationCustomerId[r.id] = customer.id
      }
    }
  }

  addGuest(g: Guest) {
    const customerId = this.getExistingCustomer(g.ssn, g.email, g.mobile)
    if (customerId) {

    } else {
      const customer = createCustomerFromGuest(this.reservations[g.reservationId], g)
      if (customer) {
        this.customers[customer.id] = customer
      }
    }

  }

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
