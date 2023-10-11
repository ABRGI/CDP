import { distanceMoreThan } from "./utils"


export type Customer = {
  id: string
  ssn?: string
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  streetAddress?: string
  city?: string
  isoCountryCode?: string                                      // ISO country code, e.g. FI
  memberId?: number
  includesChildren: boolean
  level: 'VIP' | 'Loyal' | 'Passive' | 'Risk' | 'New' | 'Guest'
  lifetimeSpend: number                                 // In euros

  bookingNightsCounts: number[]
  bookingPeopleCounts: number[]
  bookingLeadTimesDays: number[]

  avgBookingsPerYear: number
  avgBookingFrequencyDays: number
  avgNightsPerBooking: number
  avgPeoplePerBooking: number
  avgLeadTimeDays: number

  firstCheckInDate: string      // YYYY-MM-DD
  latestCheckInDate: string     // YYYY-MM-DD
  latestCheckOutDate: string    // YYYY-MM-DD
  latestHotel: string           // HKI2

  totalBookingComBookings: number
  totalExpediaBookings: number
  totalNelsonBookings: number
  totalMobileAppBookings: number

  totalLeisureBookings: number
  totalBusinessBookings: number
  totalGroupBookings: number
  totalChildrenBookings: number

  totalBookingsAsGuest: number
  totalBookings: number
  totalBookingCancellations: number
  totalBookingsPending: number

  blocked: boolean

  totalWeekDays: number
  totalWeekendDays: number

  totalHotelBookingCounts: { hotel: string, count: number }[]

  marketingPermission: boolean

  profileIds: { id: number, type: 'Reservation' | 'Guest' | 'ReservationGuest' }[]

  voucherKeys: { reservationId: number, key: string }[]

  created?: string
  updated: string

  latestCreated?: string
}

/**
 * Calculates how good match the given customer is to the given pieces of information
 * @param customer Customer to match to
 * @param ssn SSN to match
 * @param email Email to match
 * @param phoneNumber Phone number to match
 * @param firstName First name to match
 * @param lastName Last name to match
 * @returns Matching points [-4.5, 4]
 */
export const calculateCustomerMatchPoints = (customer: Customer, ssn?: string, email?: string,
  phoneNumber?: string, firstName?: string, lastName?: string): number => {
  let total = 0
  if (customer.ssn && ssn) {
    total += customer.ssn !== ssn ? -1.5 : 1
  }
  if (customer.email && email) {
    total += distanceMoreThan(customer.email, email, 1) ? -1 : 1
  }
  if (customer.phoneNumber && phoneNumber) {
    total += distanceMoreThan(customer.phoneNumber, phoneNumber, 1) ? -1 : 1
  }
  if (customer.firstName && customer.lastName && firstName && lastName) {
    total += distanceMoreThan(`${customer.firstName} ${customer.lastName}`, `${firstName} ${lastName}`, 1) ? -1 : 1
  }
  return total
}


/**
 * Returns true if customer has given reservation
 * @param customer Customer to search for
 * @param reservationId Reservation ID to check
 * @returns
 */
export const hasCustomerReservation = (customer: Customer, reservationId: number): boolean => {
  return customer.profileIds.find(pid => pid.id === reservationId && pid.type === "Reservation") !== undefined
}

/**
 * Returns true if customer has given guest
 * @param customer Customer to search for
 * @param guestId Guest ID to check
 * @returns
 */
export const hasCustomerGuest = (customer: Customer, guestId: number): boolean => {
  return customer.profileIds.find(pid => pid.id === guestId && pid.type === "Guest") !== undefined
}

/**
 * Returns true if customer has given guest in some reservation
 * @param customer Customer to search for
 * @param guestId Guest ID to check
 * @returns
 */
export const hasCustomerReservationGuest = (customer: Customer, guestId: number): boolean => {
  return customer.profileIds.find(pid => pid.id === guestId && pid.type === "ReservationGuest") !== undefined
}