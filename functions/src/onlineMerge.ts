import dayjs from "dayjs"
import { BigQuerySimple } from "./bigquery"
import { Customer, calculateCustomerMatchPoints, hasCustomerGuest, hasCustomerReservation, hasCustomerReservationGuest } from "./customer"
import { Guest, addGuestToCustomer, createCustomerFromGuest, fillInCustomerFromGuest, mergeGuestToCustomer } from "./guest"
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
    console.log(`Checking latest merging updated: ${latest.updated}`)
    const latestUpdate = latest.updated ? dayjs(latest.updated).format(timestampFormat) : dayjs().year(1970).format(timestampFormat)

    const newReservations = await this.bigQuery.query<Reservation>(this.datasetId, `SELECT * FROM reservations WHERE updated>TIMESTAMP('${latestUpdate}') ORDER BY updated ASC LIMIT 80`)
    if (!newReservations.length) {
      return status
    }

    console.log(`Found ${newReservations.length} new reservations`)
    const minReservationId = newReservations.reduce((all, curr) => Math.min(all, curr.id), newReservations[0].id)
    const maxReservationId = newReservations.reduce((all, curr) => Math.max(all, curr.id), newReservations[0].id)

    const newGuests = await this.bigQuery.query<Guest>(this.datasetId, `SELECT * FROM guests WHERE reservationId>=${minReservationId} AND reservationId <= ${maxReservationId} AND guestIndex > 0`)
    console.log(`Found ${newGuests.length} new guests`)
    const startTime = new Date().getTime()
    for (const reservation of newReservations) {
      console.log(`Merging reservation ${reservation.id}`)
      const guests = newGuests.filter(g => g.reservationId === reservation.id)
      const addStatus = await this.addReservation(reservation, guests)
      status.newGuests += addStatus.newGuests
      status.newProfiles += addStatus.newProfiles
      status.newReservations += addStatus.newReservations
      status.updatedProfiles += addStatus.updatedProfiles
      const timeDiff = new Date().getTime() - startTime
      if (timeDiff > 440000) {
        break;
      }
    }
    console.log(status)
    const customers = this.merger.getCustomers()
    const updatedCustomers = customers.filter(c => this.updatedCustomerIds.has(c.id))
    const createdCustomers = customers.filter(c => this.createdCustomerIds.has(c.id))
    try {
      await this.removeCustomers(Array.from(this.updatedCustomerIds.values()))
      await this.createCustomers(updatedCustomers)
      await this.createCustomers(createdCustomers)
    }
    catch (exception: any) {
      if (exception.code !== 400 || exception.errors[0].message.indexOf("streaming buffer") === -1) {
        throw exception
      } else {
        console.log("Ignore streaming buffer error and try later")
      }
    }
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
      if (!hasCustomerReservation(customer, r.id)) {
        status.newReservations++
      }
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
      status.newReservations++
      status.newProfiles++
    }
    if (customer) {
      let recreate = false
      for (const g of guests) {
        if (g.guestIndex === 0) {
          customer = fillInCustomerFromGuest(customer, g)
        } else {
          if (!hasCustomerReservationGuest(customer, g.id)) {
            customer = await this.onlineAddGuestToCustomer(customer, g)
          } else {
            recreate = true
          }
        }
        status.newGuests++
      }
      if (recreate) {
        customer = await this.recreateCustomer(customer)
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

  removeDuplicateCustomerProfiles = async (): Promise<void> => {
    const profiles = await this.bigQuery.query<{ id: string, updated: string }>(this.datasetId,
      'SELECT id, updated WHERE TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), updated, MINUTE) > 240 FROM customers  ORDER BY updated DESC')
    const foundIds: { [id: string]: string } = {}
    let duplicates = 0
    for (const profile of profiles) {
      if (!(profile.id in foundIds)) {
        foundIds[profile.id] = profile.updated
      } else {
        console.log(`KEEPING profile ${profile.id} updated ${foundIds[profile.id]}`)
        console.log(`DELETING profile ${profile.id} updated ${profile.updated}`)
        await this.bigQuery.delete(this.datasetId, `DELETE FROM customers WHERE id='${profile.id}' AND updated='${profile.updated}'`)
        console.log('-------------------------------------------------------------------------------------------')
        duplicates++
      }
    }
    console.log(`Found ${duplicates} duplicate profiles.`)
  }

  removeDuplicateReservations = async (): Promise<void> => {
    const allIds = await this.bigQuery.query<{ customerId: string, type: string, id: string }>(this.datasetId,
      "SELECT c.id as customerId, updated, ids.type as type, ids.id as id FROM customers as c, UNNEST(c.profileIds) as ids WHERE TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), updated, MINUTE) > 240 ORDER BY updated DESC")

    const guests: { [guestId: string]: string[] } = {}
    const reservations: { [reservationId: string]: string[] } = {}

    for (const id of allIds) {
      if (id.type === "Guest") {
        guests[id.id] = (guests[id.id] || [])
        if (guests[id.id].indexOf(id.customerId) === -1) {
          guests[id.id].push(id.customerId)
        }
      }
      else if (id.type === "Reservation") {
        reservations[id.id] = (reservations[id.id] || [])
        if (reservations[id.id].indexOf(id.customerId) === -1) {
          reservations[id.id].push(id.customerId)
        }
      } else if (id.type !== "ReservationGuest") {
        throw Error(`Unknown id type: ${id.type}`)
      }
    }
    console.log('Check for duplicate guests')
    for (const key of Object.keys(guests)) {
      const guestIds = guests[key]
      if (guestIds.length > 1) {
        const customers = await this.getCustomers(guestIds)
        const guest = await this.getGuest(parseInt(key, 10))
        const matchingCustomer = await this.findExistingCustomer(guest.ssn, guest.email, guest.mobile, guest.firstName, guest.lastName)
        if (matchingCustomer) {
          console.log(`Merge guest to customer ${matchingCustomer.id}`)
          const reservation = await this.getReservation(guest.reservationId)
          await this.onlineMergeGuestToCustomer(matchingCustomer, reservation, guest)
          for (const customer of customers) {
            if (customer.id !== matchingCustomer.id) {
              customer.profileIds = customer.profileIds.filter(pid => pid.type !== "Guest" && pid.id !== guest.id)
              if (customer.profileIds.length > 0) {
                await this.updateCustomer(await this.recreateCustomer(customer))
              } else {
                await this.removeCustomer(customer.id)
              }
            }
          }
        } else {
          console.error(`Matching customer not found guest id ${guest.id}`)
        }
      }
    }
    console.log('Done')
    console.log('Check for duplicate reservations')
    for (const key of Object.keys(reservations)) {
      const reservationIds = reservations[key]
      if (reservationIds.length > 1) {
        const customers = await this.getCustomers(reservationIds)
        const reservation = await this.getReservation(parseInt(key, 10))
        const matchingCustomer = await this.findExistingCustomer(reservation.customerSsn, reservation.customerEmailReal,
          reservation.customerMobile, reservation.customerFirstName, reservation.customerLastName)
        if (matchingCustomer) {
          console.log(`Merge reservation to customer ${matchingCustomer.id}`)
          await this.onlineMergeReservationToCustomer(matchingCustomer, reservation)
          for (const customer of customers) {
            if (customer.id !== matchingCustomer.id) {
              const guests = await this.getGuests(customer.profileIds.filter(g => g.type === "ReservationGuest").map(g => g.id))
              customer.profileIds = customer.profileIds.filter(pid => {
                if (pid.type === "ReservationGuest" && guests.find(g => g.id === pid.id && g.reservationId === reservation.id)) {
                  return false
                }
                return pid.type !== "Reservation" && pid.id !== reservation.id
              })
              if (customer.profileIds.length > 0) {
                console.log(`Update customer ${customer.id} without the reservation ${reservation.id}`)
                await this.updateCustomer(await this.recreateCustomer(customer))
              } else {
                console.log(`Remove empty customer ${customer.id}`)
                await this.removeCustomer(customer.id)
              }
            }
          }
        } else {
          console.error(`Matching customer not found guest id ${reservation.id}`)
        }
      }
    }
    console.log('Done')
  }

  async getCustomers(customerIds: string[]): Promise<Customer[]> {
    if (customerIds.length === 0) return []
    return this.bigQuery.query(this.datasetId, `SELECT * FROM customers WHERE id IN (${customerIds.map(id => `'${id}'`).join(',')})`)
  }

  async getGuests(guestIds: number[]): Promise<Guest[]> {
    if (guestIds.length === 0) return []
    return this.bigQuery.query(this.datasetId, `SELECT * FROM guests WHERE id IN (${guestIds.map(id => id).join(',')})`)
  }

  async getGuest(id: number): Promise<Guest> {
    return this.bigQuery.queryOne(this.datasetId, `SELECT * FROM guests WHERE id=${id}`)
  }

  async getReservation(id: number): Promise<Reservation> {
    return this.bigQuery.queryOne(this.datasetId, `SELECT * FROM reservations WHERE id=${id}`)
  }

  async updateCustomer(customer: Customer): Promise<void> {
    await this.bigQuery.delete(this.datasetId, `DELETE FROM customers WHERE id='${customer.id}'`)
    await this.bigQuery.insertOne(this.datasetId, "customers", customer)
  }

  async removeCustomer(customerId: string): Promise<void> {
    await this.bigQuery.delete(this.datasetId, `DELETE FROM customers WHERE id='${customerId}'`)
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


    const promises: Promise<Customer[]>[] = []
    if (ssn) { promises.push(this.findCustomerWithSsn(ssn).then(c => c ? [c] : [])) }
    if (email) { promises.push(this.findCustomerWithEmail(email, 1)) }
    if (phoneNumber) { promises.push(this.findCustomerWithPhoneNumber(phoneNumber, 1)) }
    if (firstName && lastName) { promises.push(this.findCustomerWithName(`${firstName} ${lastName}`, 1)) }

    const results = await Promise.all(promises)
    for (const result of results) {
      for (const match of result) {
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
          WHERE email IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(email, '${email}', ${maxDistance}) <= ${maxDistance}
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
          WHERE phoneNumber IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(phoneNumber, '${phoneNumber}', ${maxDistance}) <= ${maxDistance}
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
          WHERE firstName IS NOT NULL AND lastName IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(CONCAT(firstName, ' ', lastName), '${name}', ${maxDistance}) <= ${maxDistance}
      `)
  }

  /**
   * Search by any of three
   * @param name Name to search for (first + last)
   * @param phoneNumber Phone number to search for
   * @param email Email to search for
   * @param maxDistance Maximum Levenshtein distance
   * @returns
   */
  protected async findCustomerWithEmailPhoneNumberName(name: string | undefined, phoneNumber: string | undefined, email: string | undefined, maxDistance: number): Promise<Customer[]> {
    const conditions: string[] = []
    if (name) {
      conditions.push(`(firstName IS NOT NULL AND lastName IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(CONCAT(firstName, ' ', lastName), '${name}', ${maxDistance}) <= ${maxDistance})`)
    }
    if (phoneNumber) {
      conditions.push(`(phoneNumber IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(phoneNumber, '${phoneNumber}', ${maxDistance}) <= ${maxDistance})`)
    }
    if (email) {
      conditions.push(`(email IS NOT NULL AND \`${this.projectId}.${this.datasetId}\`.levenshtein_distance_routine(email, '${email}', ${maxDistance}) <= ${maxDistance})`)
    }
    if (conditions.length === 0) {
      return []
    }
    return await this.bigQuery.query<Customer>(this.datasetId,
      `SELECT * FROM customers WHERE ${conditions.join(" OR ")}`)
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
   * Merges given guest to customer and reconstructs profile if guest is already part of the profile
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
