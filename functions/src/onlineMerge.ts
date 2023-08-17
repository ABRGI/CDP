import { BigQuerySimple } from "./bigquery"
import { Customer, calculateCustomerMatchPoints } from "./customer"
import { Guest, addGuestToCustomer, createCustomerFromGuest, mergeGuestToCustomer } from "./guest"
import { Reservation, createCustomerFromReservation, mergeReservationToCustomer } from "./reservation"


export type MergingStatus = {

}


/**
 * Online merging of customer profiles based on incoming reservations
 */
export class OnlineMerger {
  protected bigQuery: BigQuerySimple
  protected datasetId: string

  constructor(projectId: string, datasetId: string) {
    this.bigQuery = new BigQuerySimple(projectId)
    this.datasetId = datasetId
  }

  /**
   * Add reservation information to the customer profiles or creates a new one
   * @param r Reservation to add
   */
  protected async addReservation(r: Reservation, guests: Guest[]) {
    let customer = await this.findExistingCustomer(r.customerSsn, r.customerEmailReal, r.customerMobile,
      r.customerFirstName, r.customerLastName)
    if (customer) {
      await this.removeCustomer(customer.id)
      customer = mergeReservationToCustomer(customer, r)
    } else {
      customer = createCustomerFromReservation(r)
    }
    if (customer) {
      for (const g of guests) {
        customer = addGuestToCustomer(customer, g)
      }
      await this.createCustomer(customer)
    }
    for (const g of guests) {
      customer = await this.findExistingCustomer(g.ssn, g.email, g.mobile)
      if (!customer) {
        const customer = createCustomerFromGuest(r, g)
        if (customer) {
          await this.createCustomer(customer)
        }
      } else {
        await this.removeCustomer(customer.id)
        customer = mergeGuestToCustomer(customer, r, g)
        await this.createCustomer(customer)
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
  async findExistingCustomer(ssn?: string, email?: string, phoneNumber?: string, firstName?: string, lastName?: string): Promise<Customer | undefined> {
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
  protected async createCustomer(customer: Customer) {
    await this.bigQuery.insertOne(this.datasetId, "customers", customer)
  }

  /**
   * Removes customer from BigQuery
   * @param customerId Id of the custoemr remove
   */
  protected async removeCustomer(customerId: string) {
    await this.bigQuery.delete(this.datasetId, `DELETE FROM customers WHERE id='${customerId}`)
  }

  /**
   * Searches if there is customer with given SSN in BigQuery
   * @param ssn SSN to search for
   * @returns
   */
  protected async findCustomerWithSsn(ssn: string): Promise<Customer | undefined> {
    return await this.bigQuery.queryOne(this.datasetId, `SELECT * FROM customers WHERE ssn=${ssn}`) as Customer
  }

  /**
   * Searches for customers with similar email address
   * @param email Email to search for
   * @param maxDistance Maximum Levenshtein distance of email addresses
   */
  protected async findCustomerWithEmail(email: string, maxDistance: number): Promise<Customer[]> {
    return await this.bigQuery.query<Customer>(this.datasetId,
      `SELECT * FROM customers
          WHERE levenshtein_distance_routine(email, '${email}') <= ${maxDistance} AND email IS NOT NULL
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
          WHERE levenshtein_distance_routine(phoneNumber, '${phoneNumber}') <= ${maxDistance} AND phoneNumber IS NOT NULL
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
          WHERE levenshtein_distance_routine(CONCAT(firstName, ' ', lastName), '${name}') <= ${maxDistance} AND
            firstName IS NOT NULL AND lastName IS NOT NULL
      `)
  }

  /**
   * Search for reservation
   * @param reservationId Id of the reservation to search for
   */
  protected async findReservation(reservationId: number): Promise<Reservation | undefined> {
    return await this.bigQuery.queryOne<Reservation>(this.datasetId,
      `SELECT * FROM reservations WHERE id=${reservationId}`)
  }

  /**
   * Searches for customer based on reservation ID
   * @param reservationId Reservation ID user for searching
   */
  protected async findCustomerByReservationId(reservationId: number): Promise<Customer | undefined> {
    return await this.bigQuery.queryOne<Reservation>(this.datasetId,
      `SELECT * FROM customers WHERE ${reservationId} IN reservationIds`)
  }
}
