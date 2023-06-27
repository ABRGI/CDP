import { Customer, calculateCustomerMatchPoints } from "./customer"
import { TreeDictionary } from "./dictionary"
import { Guest, addGuestToCustomer, createCustomerFromGuest, mergeGuestToCustomer } from "./guest"
import { MinimalReservation, Reservation, createCustomerFromReservation, mergeReservationToCustomer } from "./reservation"


/**
 * Class for creating customer profiles from stream of reservations and guest information.
 * It is assumed that reservations are given ordered by the reservation ID.
 */
export class CustomerMerger {
  emailIds: { [email: string]: string } = {}
  ssnIds: { [ssn: string]: string } = {}
  phoneNumberIds: { [phoneNumber: string]: string } = {}
  nameIds: { [name: string]: string[] } = {}
  customers: { [id: string]: Customer } = {}
  reservations: { [id: string]: MinimalReservation } = {}
  reservationCustomerId: { [reservationId: string]: string } = {}

  emailDictionary = new TreeDictionary()
  phoneNumberDictionary = new TreeDictionary()
  namesDictionary = new TreeDictionary()

  /**
   * Add reservation information to the customer profiles or creates a new one
   * @param r Reservation to add
   */
  addReservation(r: Reservation) {
    this.reservations[r.id] = {
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      hotel: r.hotel,
      state: r.state,
      marketingPermission: r.marketingPermission
    }
    const customerId = this.getExistingCustomer(r.customerSsn, r.customerEmailReal, r.customerMobile,
      r.customerFirstName, r.customerLastName)
    if (customerId) {
      this.reservationCustomerId[r.id] = customerId
      this.customers[customerId] = mergeReservationToCustomer(this.customers[customerId], r)
    } else {
      const customer = createCustomerFromReservation(r)
      if (customer) {
        this.addCustomerToIndices(customer)
        this.reservationCustomerId[r.id] = customer.id
      }
    }
  }

  /**
   * Add guest information to the customer profiles or creates a new one
   * @param g Guest to add
   */
  addGuest(g: Guest) {
    // Handling the guest customer profile, it is only added if such customer does not exist
    const customerId = this.getExistingCustomer(g.ssn, g.email, g.mobile)
    const r = this.reservations[g.reservationId]
    if (!customerId && r) {
      const customer = createCustomerFromGuest(r, g)
      if (customer) {
        this.addCustomerToIndices(customer)
      }
    }

    // Add the guest information to the booking customer
    const reservationCustomerId = this.reservationCustomerId[g.reservationId]
    if (reservationCustomerId) {
      const customer = this.customers[reservationCustomerId]
      if (customer && !this.isGuestMatch(customer, g)) {
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
  getExistingCustomer(ssn?: string, email?: string, phoneNumber?: string, firstName?: string, lastName?: string): string | undefined {
    const potentials = new Set<string>()
    if (ssn && ssn in this.ssnIds) {
      potentials.add(this.ssnIds[ssn])
    }
    if (email) {
      const matches = this.emailDictionary.findMatches(email, 1)
      for (const match of matches) {
        potentials.add(this.emailIds[match])
      }
    }
    if (phoneNumber) {
      const matches = this.phoneNumberDictionary.findMatches(phoneNumber, 1)
      for (const match of matches) {
        potentials.add(this.phoneNumberIds[match])
      }
    }
    if (firstName && lastName) {
      const matches = this.namesDictionary.findMatches(`${firstName} ${lastName}`, 1)
      for (const match of matches) {
        for (const id of this.nameIds[match]) {
          potentials.add(id)
        }
      }
    }
    let maxPoints = -1000
    let maxCustomer: Customer | undefined
    for (const id of potentials.values()) {
      const customer = this.customers[id]
      if (customer) {
        const points = calculateCustomerMatchPoints(customer, ssn, email, phoneNumber, firstName, lastName)
        if (points > maxPoints && points > 1) {
          maxPoints = points
          maxCustomer = customer
        }
      }
    }
    return maxCustomer?.id
  }

  /**
   * Get list of all customers
   * @returns All customers
   */
  getCustomers(): Customer[] {
    return Object.values(this.customers)
  }

  /**
   * Adds customer to the indices
   * @param customer Customer to add
   */
  private addCustomerToIndices(customer: Customer): void {
    this.customers[customer.id] = customer
    if (customer.ssn) {
      this.ssnIds[customer.ssn] = customer.id
    }
    if (customer.email) {
      this.emailIds[customer.email] = customer.id
      this.emailDictionary.addString(customer.email)
    }
    if (customer.phoneNumber) {
      this.phoneNumberIds[customer.phoneNumber] = customer.id
      this.phoneNumberDictionary.addString(customer.phoneNumber)
    }
    if (customer.firstName && customer.lastName) {
      const name = `${customer.firstName} ${customer.lastName}`
      if (!(name in this.nameIds)) {
        this.nameIds[name] = [customer.id]
      } else {
        this.nameIds[name].push(customer.id)
      }
      this.namesDictionary.addString(name)
    }
  }

  /**
   * Checks if given customer matches the given guest
   * @param customer Customer
   * @param g Guest
   * @returns True if guest and customer are matches
   */
  private isGuestMatch(customer: Customer, g: Guest): boolean {
    return calculateCustomerMatchPoints(customer, g.ssn, g.email, g.mobile, g.firstName, g.lastName) > 1
  }
}
