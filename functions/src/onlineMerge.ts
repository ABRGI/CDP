import dayjs from "dayjs"
import { BigQuerySimple } from "./bigquery"
import { Customer, calculateCustomerMatchPoints, hasCustomerGuest, hasCustomerReservation, hasCustomerReservationGuest } from "./customer"
import { Guest, addGuestToCustomer, createCustomerFromGuest, mergeGuestToCustomer } from "./guest"
import { CustomerMerger } from "./merge"
import { Reservation, createCustomerFromReservation, mergeReservationToCustomer } from "./reservation"
import { timestampFormat } from "./utils"

/**
 * Online merging status
 */
export type MergingStatus = {
  newReservations: number
  newGuests: number
  newProfiles: number
  updatedProfiles: number
}


/**
 * Online merging of customer profiles based on incoming reservations
 */
export class OnlineMerger {
  protected bigQuery: BigQuerySimple
  protected projectId: string
  protected datasetId: string

  protected merger: CustomerMerger
  protected updatedCustomerIds: Set<string>;
  protected createdCustomerIds: Set<string>;
  protected preloadProfiles: boolean

  constructor(projectId: string, datasetId: string, preloadProfiles: boolean) {
    this.merger = new CustomerMerger()
    this.preloadProfiles = preloadProfiles
    this.updatedCustomerIds = new Set()
    this.createdCustomerIds = new Set()
    this.projectId = projectId
    this.datasetId = datasetId
    this.bigQuery = new BigQuerySimple(projectId)
  }

  /**
   * Creates/updates customer profiles based on new reservations/guests in BigQuery
   */
  async mergeNewReservations(): Promise<MergingStatus> {
    if (this.preloadProfiles) {
      this.merger = new CustomerMerger()
      this.updatedCustomerIds = new Set()
      this.createdCustomerIds = new Set()
      await this.loadProfiles()
    }
    const status = {
      newReservations: 0,
      newGuests: 0,
      newProfiles: 0,
      updatedProfiles: 0
    }
    const latest = await this.bigQuery.queryOne<{ updated: string }>(this.datasetId, `
      SELECT MAX(updated) as updated  FROM customers
    `)
    const latestUpdate = latest.updated ? dayjs(latest.updated).format(timestampFormat) : dayjs().year(1970).format(timestampFormat)

    const newReservations = await this.bigQuery.query<Reservation>(this.datasetId, `SELECT * FROM reservations WHERE updated>TIMESTAMP('${latestUpdate}') ORDER BY updated ASC`)
    if (!newReservations.length) {
      return status
    }
    const minReservationId = newReservations.reduce((all, curr) => Math.min(all, curr.id), newReservations[0].id)
    const maxReservationId = newReservations.reduce((all, curr) => Math.max(all, curr.id), newReservations[0].id)

    const newGuests = await this.bigQuery.query<Guest>(this.datasetId, `SELECT * FROM guests WHERE reservationId>=${minReservationId} AND reservationId <= ${maxReservationId} AND guestIndex > 0`)
    for (const reservation of newReservations) {
      const guests = newGuests.filter(g => g.reservationId === reservation.id)
      const addStatus = await this.addReservation(reservation, guests)
      status.newGuests += addStatus.newGuests
      status.newProfiles += addStatus.newProfiles
      status.newReservations += addStatus.newReservations
      status.updatedProfiles += addStatus.updatedProfiles
    }

    const customers = this.merger.getCustomers()
    const updatedCustomers = customers.filter(c => this.updatedCustomerIds.has(c.id))
    const createdCustomers = customers.filter(c => this.createdCustomerIds.has(c.id))
    await this.removeCustomers(Array.from(this.updatedCustomerIds.values()))
    await this.createCustomers(updatedCustomers)
    await this.createCustomers(createdCustomers)
    return status
  }

  /**
   * Add reservation information to the customer profiles or creates a new one
   * @param r Reservation to add
   */
  protected async addReservation(r: Reservation, guests: Guest[]): Promise<MergingStatus> {
    const status = {
      newReservations: 0,
      newGuests: 0,
      newProfiles: 0,
      updatedProfiles: 0
    }

    let customer = await this.findExistingCustomer(r.customerSsn, r.customerEmailReal, r.customerMobile,
      r.customerFirstName, r.customerLastName)
    if (customer) {
      customer = await this.onlineMergeReservationToCustomer(customer, r)
      if (!this.createdCustomerIds.has(customer.id)) {
        this.updatedCustomerIds.add(customer.id)
      }
      status.updatedProfiles++
    } else {
      customer = createCustomerFromReservation(r)
      if (customer) {
        this.createdCustomerIds.add(customer.id)
      }
      status.newProfiles++
    }
    if (customer) {
      for (const g of guests) {
        customer = await this.onlineAddGuestToCustomer(customer, g)
        status.newGuests++
      }
      this.merger.addCustomerToIndices(customer)
    }
    for (const g of guests) {
      if (g.ssn !== r.customerSsn && g.email !== r.customerEmailReal && g.mobile !== r.customerMobile && g.guestIndex > 0) {
        customer = await this.findExistingCustomer(g.ssn, g.email, g.mobile)
        if (!customer) {
          const customer = createCustomerFromGuest(r, g)
          if (customer) {
            this.merger.addCustomerToIndices(customer)
            this.createdCustomerIds.add(customer.id)
            status.newProfiles++
          }
        } else {
          customer = await this.onlineMergeGuestToCustomer(customer, r, g)
          this.merger.addCustomerToIndices(customer)
          status.updatedProfiles++
          if (!this.createdCustomerIds.has(customer.id)) {
            this.updatedCustomerIds.add(customer.id)
          }
        }
      }
    }
    return status
  }

  /**
   * Check if there is customer with any of the given parameters
   * @param ssn Social Security Number
   * @param email email
   * @param phoneNumber phone number
   * @returns customer ID if one is found, undefined otherwise
   */
  async findExistingCustomer(ssn?: string, email?: string, phoneNumber?: string, firstName?: string, lastName?: string): Promise<Customer | undefined> {
    const customer = this.merger.findExistingCustomer(ssn, email, phoneNumber, firstName, lastName)
    if (customer || this.preloadProfiles) {
      return customer
    }

    const potentials = new Set<Customer>()
    const ssnCustomer = ssn ? (await this.findCustomerWithSsn(ssn)) : undefined
    if (ssn && ssnCustomer) {
      potentials.add(ssnCustomer)
    }
    if (email) {
      const matches = await this.findCustomerWithEmail(email, 1)
      for (const match of matches) {
        potentials.add(match)
      }
    }
    if (phoneNumber) {
      const matches = await this.findCustomerWithPhoneNumber(phoneNumber, 1)
      for (const match of matches) {
        potentials.add(match)
      }
    }
    if (firstName && lastName) {
      const matches = await this.findCustomerWithName(`${firstName} ${lastName}`, 1)
      for (const match of matches) {
        potentials.add(match)
      }
    }
    let maxPoints = -1000
    let maxCustomer: Customer | undefined
    for (const customer of potentials.values()) {
      if (customer) {
        const points = calculateCustomerMatchPoints(customer, ssn, email, phoneNumber, firstName, lastName)
        if (points > maxPoints && points > 1) {
          maxPoints = points
          maxCustomer = customer
        }
      }
    }
    return maxCustomer
  }

  /**
   * Creates customer to BigQuery
   * @param customer Customer to create
   */
  protected async createCustomers(customers: Customer[]) {
    if (customers.length > 0) {
      await this.bigQuery.insert(this.datasetId, "customers", customers)
    }
  }

  /**
   * Removes customers from BigQuery
   * @param customerId Id of the custoemr remove
   */
  protected async removeCustomers(customerIds: string[]) {
    if (customerIds.length > 0) {
      await this.bigQuery.delete(this.datasetId, `DELETE FROM customers WHERE id IN (${customerIds.map(id => `'${id}'`).join(',')})`)
    }
  }

  /**
   * Searches if there is customer with given SSN in BigQuery
   * @param ssn SSN to search for
   * @returns
   */
  protected async findCustomerWithSsn(ssn: string): Promise<Customer | undefined> {
    return await this.bigQuery.queryOne(this.datasetId, `SELECT * FROM customers WHERE ssn='${ssn}'`) as Customer
  }

  /**
   * Searches for customers with similar email address
   * @param email Email to search for
   * @param maxDistance Maximum Levenshtein distance of email addresses
   */
  protected async findCustomerWithEmail(email: string, maxDistance: number): Promise<Customer[]> {
    return await this.bigQuery.query<Customer>(this.datasetId,
      `SELECT * FROM customers
          WHERE email IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(email, '${email}') <= ${maxDistance}
      `)
  }

  /**
   * Searches for customers with similar phone numbers
   * @param phoneNumber Phone number to search for
   * @param maxDistance Maximum Levenshtein distance of phone numbers
   */
  protected async findCustomerWithPhoneNumber(phoneNumber: string, maxDistance: number): Promise<Customer[]> {
    return await this.bigQuery.query<Customer>(this.datasetId,
      `SELECT * FROM customers
          WHERE phoneNumber IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(phoneNumber, '${phoneNumber}') <= ${maxDistance}
      `)
  }

  /**
   * Search for customers with similar name
   * @param name Name to search for (first + last)
   * @param maxDistance Maximum Levenshtein distance of names
   */
  protected async findCustomerWithName(name: string, maxDistance: number): Promise<Customer[]> {
    return await this.bigQuery.query<Customer>(this.datasetId,
      `SELECT * FROM customers
          WHERE firstName IS NOT NULL AND lastName IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(CONCAT(firstName, ' ', lastName), '${name}') <= ${maxDistance}
      `)
  }

  /**
   * Preload all customer profiles to memory from BigQuery to speedup large reservation batch merging
   */
  protected async loadProfiles(): Promise<void> {
    const customers = await this.bigQuery.query<Customer>(this.datasetId, 'SELECT * FROM customers')
    for (const customer of customers) {
      this.merger.addCustomerToIndices(customer)
    }
  }

  /**
   * Merges given reservation and reconstructs profile if reservation is already part of the profile
   * @param customer Customer to merge to
   * @param r Reservation to merge
   * @returns
   */
  protected async onlineMergeReservationToCustomer(customer: Customer, r: Reservation): Promise<Customer> {
    if (!hasCustomerReservation(customer, r.id)) {
      return mergeReservationToCustomer(customer, r)
    }
    return await this.recreateCustomer(customer)
  }

  /**
   * Adds given guest to customer and reconstructs profile if guest is already part of the profile
   * @param customer
   * @param g
   * @returns
   */
  protected async onlineAddGuestToCustomer(customer: Customer, g: Guest): Promise<Customer> {
    if (!hasCustomerReservationGuest(customer, g.id))
      return addGuestToCustomer(customer, g)
    return await this.recreateCustomer(customer)
  }

  /**
   * Merges given guest to customer and reconstructs profile ig guest is already part of the profile
   * @param customer
   * @param r
   * @param g
   * @returns
   */
  protected async onlineMergeGuestToCustomer(customer: Customer, r: Reservation, g: Guest): Promise<Customer> {
    if (!hasCustomerGuest(customer, g.id)) {
      return mergeGuestToCustomer(customer, r, g)
    }
    return await this.recreateCustomer(customer)
  }

  /**
   * Recreates customer profile based on profile IDs
   * @param customer Customer to recreate
   */
  protected async recreateCustomer(customer: Customer): Promise<Customer> {
    const profileIds = customer.profileIds
    let newCustomer: Customer | undefined

    for (const pid of profileIds) {
      if (pid.type === "Guest") {
        const guest = await this.bigQuery.queryOne<Guest>(this.datasetId, `SELECT * FROM guests WHERE id=${pid.id}`)
        const reservation = await this.bigQuery.queryOne<Reservation>(this.datasetId, `SELECT * FROM reservations WHERE id=${guest.reservationId}`)
        if (guest && reservation) {
          if (newCustomer) {
            newCustomer = mergeGuestToCustomer(newCustomer, reservation, guest)
          } else {
            newCustomer = createCustomerFromGuest(reservation, guest)
          }
        }
      }
      else if (pid.type === "ReservationGuest" && newCustomer) {
        const guest = await this.bigQuery.queryOne<Guest>(this.datasetId, `SELECT * FROM guests WHERE id=${pid.id}`)
        if (guest) {
          newCustomer = addGuestToCustomer(newCustomer, guest)
        }
      } else if (pid.type === "Reservation") {
        const reservation = await this.bigQuery.queryOne<Reservation>(this.datasetId, `SELECT * FROM reservations WHERE id=${pid.id}`)
        if (reservation) {
          if (newCustomer) {
            newCustomer = mergeReservationToCustomer(newCustomer, reservation)
          } else {
            newCustomer = createCustomerFromReservation(reservation)
          }
        }
      }
    }
    if (!newCustomer) {
      return customer
    }
    return newCustomer
  }
}
