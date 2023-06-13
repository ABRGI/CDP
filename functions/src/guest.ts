import dayjs from "dayjs"
import { Customer } from "./customer"
import { Reservation } from "./reservation"
import { calculateDaysBetween, createHashId } from "./utils"
import { mergeHotelCounts } from "./hotel"

export type Guest = {
  id: number,
  reservationId: number,
  roomAlias: number,
  guestIndex: number,
  firstName: string,
  lastName: string,
  nationality?: string     // 'FIN'
  email?: string,
  mobile?: string,
  ssn?: string,
  dateOfBirth?: string     // '1969-01-01'
  purposeOfVisit?: string  // 'LEISURE'
  age?: number
  passportNumber?: string,
  marketingPermission: boolean   // 'FALSE',
  isoCountryCode: string        // 'FIN'
  signatureId?: string
}

const guestInt = new Set([
  "id", "reservationId", "roomAlias", "guestIndex", "age"
])

const guestBools = new Set([
  "marketingPermission"
])

export const mapGuestValue = (props: { header: string, value: string }): boolean | string | number | undefined => {
  const value = props.value.trim()
  if (value === '') {
    return
  }
  if (guestInt.has(props.header)) {
    return parseInt(value, 10)
  }
  if (guestBools.has(props.header)) {
    return value === "TRUE"
  }
  if (props.header === "mobile") {
    return value.trim().replace(/ /g, "").replace(/^0/, "+358")
  }
  return value
}

export const isGuestMatch = (r1: Guest, r2: Guest): boolean => {
  return r1.ssn === r2.ssn || r1.email === r2.email ||
    r1.mobile === r2.mobile
}

/**
 * Create customer from guest information
 * @param r Reservation mentioned in the guest information
 * @param g Guest information
 * @returns
 */
export const createCustomerFromGuest = (r: Reservation, g: Guest): Customer | undefined => {
  if (g.ssn || g.email || g.mobile) {
    const { weekendDays, weekDays } = calculateDaysBetween(r.checkIn, r.checkOut)
    return {
      id: createHashId(`${r.id}-${g.id}`),
      ssn: g.ssn,
      email: g.email,
      phoneNumber: g.mobile,
      dateOfBirth: g.dateOfBirth,
      isoCountryCode: g.isoCountryCode,
      includesChildren: dayjs().diff(dayjs(g.dateOfBirth), "years") < 18,
      level: 'Guest',
      lifetimeSpend: 0,

      bookingNightsCounts: [],
      bookingPeopleCounts: [],
      bookingLeadTimesDays: [],

      avgBookingsPerYear: 0,
      avgBookingFrequencyDays: 0,
      avgNightsPerBooking: 0,
      avgPeoplePerBooking: 0,
      avgLeadTimeDays: 0,

      firstCheckInDate: r.checkIn,
      latestCheckInDate: r.checkIn,
      latestCheckOutDate: r.checkOut,
      latestHotel: r.hotel,

      totalBookingComBookings: 0,
      totalExpediaBookings: 0,
      totalNelsonBookings: 0,
      totalMobileAppBookings: 0,

      totalLeisureBookings: 0,
      totalBusinessBookings: 0,

      totalBookingsAsGuest: 1,
      totalBookings: 0,

      blocked: r.state === "BLOCKED",

      totalWeekDays: weekDays,
      totalWeekendDays: weekendDays,

      totalHotelBookingCounts: [],

      marketingPermission: r.marketingPermission
    }
  }
  return
}

/**
 * Merges guest stay information to an existing customer
 * @param c Existing customer
 * @param r Reservation related to guest stay
 * @param g Guest information
 * @returns
 */
export const mergeGuestToCustomer = (c: Customer, r: Reservation, g: Guest): Customer => {
  const nc = createCustomerFromGuest(r, g)
  if (!nc) {
    return c
  }

  const { weekendDays, weekDays, totalDays } = calculateDaysBetween(r.checkIn, r.checkOut)
  return {
    ...c,
    dateOfBirth: c.dateOfBirth || nc.dateOfBirth,
    isoCountryCode: c.isoCountryCode || nc.isoCountryCode,
    includesChildren: c.includesChildren || nc.includesChildren,
    level: c.level,
    lifetimeSpend: c.lifetimeSpend + nc.lifetimeSpend,

    latestCheckInDate: r.checkIn,
    latestCheckOutDate: r.checkOut,
    latestHotel: r.hotel,

    totalBookingsAsGuest: c.totalBookingsAsGuest + 1,
    blocked: r.state === "BLOCKED",

    totalWeekDays: weekDays,
    totalWeekendDays: weekendDays,

    marketingPermission: nc.marketingPermission
  }
}

/**
 * Adds guest metrics to a customer. In this case the guest is a guest of the customer.
 * @param c Existing customer
 * @param g Guest stay
 */
export const addGuestToCustomer = (c: Customer, g: Guest): Customer => {
  const bookingPeopleCounts = c.bookingPeopleCounts.map((count, index) =>
    index < c.bookingPeopleCounts.length - 1 ? count : count + 1)
  return {
    ...c,
    includesChildren: c.includesChildren || dayjs().diff(dayjs(g.dateOfBirth), "years") < 18,
    bookingPeopleCounts,
    avgPeoplePerBooking: c.bookingPeopleCounts.reduce((t, c) => t + c, 0) / c.bookingPeopleCounts.length,
  }
}