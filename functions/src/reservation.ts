import dayjs from "dayjs"
import { Customer } from "./customer"
import { RoundToTwo, calculateDaysBetween, maxTimestamp } from "./utils"
import { mergeHotelCounts } from "./hotel"

export type WaitingReservation = {
  id: number
  guestIds: number[]
  updated: string
}

export type Reservation = {
  id: number,
  version: number
  reservationCode: number,
  uuid: string,
  hotelId: number,
  lang: string,                   // 'en', 'fi', 'ru', 'sv', 'et'
  totalPaid: number,
  currency: string,               // EUR (only)
  customerFirstName?: string,
  customerLastName?: string,
  customerMobile?: string,         // '', '+3585089712389123', may contain whitespaces
  customerAddress?: string,        // '', 'Tietie 12'
  customerPostalCode?: string,     // '', '00100', may contain also '00100 Helsinki'
  customerCity?: string,           // ''
  customerSsn?: string,            // ''
  customerDateOfBirth?: string,    // '', '1900-01-01'
  customerPurposeOfVisit?: 'LEISURE' | 'BUSINESS'
  customerNationality?: string     // 'FIN', ''
  companyName?: string,            // ''
  companyReference?: string,       // '', can be for example name of contact
  bookingChannel: 'BOOKINGCOM' | 'EXPEDIA' | 'NELSON' | 'MOBILEAPP'
  bookingChannelReservationId?: string, // '', number
  checkIn: string,       // '2020-09-12 13:00:00'
  checkOut: string,      // '2020-09-13 09:00:00'
  created: string,       // '', '2020-02-13'
  confirmed?: string,    // '2020-04-03'
  cancelled: boolean        // TRUE|FALSE
  isFullyRefunded: boolean  // TRUE|FALSE
  pendingConfirmationSince?: string,     // '', '2021-11-08 00:00:00'
  changeType?: string,       // '', 'EXTEND'
  state: 'CONFIRMED' | 'CANCELLED' | 'PENDING_CONFIRMATION' | 'BLOCKED'
  notifyCustomer: boolean    // TRUE|FALSE
  isOverrided: boolean       // TRUE|FALSE
  type: number,              // 1-3
  modifiedBy?: string,               // '', 'xxxx.yyyy@securitas.fi'
  marketingPermission: boolean       // TRUE|FALSE,
  customerEmailReal?: string         // '', 'jorma-petteri.luukku@luukku.com',
  customerEmailVirtual?: string,     // '', 'xxxx@guest.booking.com
  totalPaidExtraForOta: number,
  breakfastsForAll: boolean         // TRUE|FALSE
  companyYTunnus?: string,          // '', '1234567-8', 'GB123456'
  customerPassportNumber?: string,  // ''
  memberId?: number,                // '', '12389123'
  customerIsoCountryCode: string,   // 'FIN', 'DEU', 'BEL', 'GBR', ...
  cancellationReason?: string,      // '', 'TRIP_GOT_CANCELLED', 'OTHER'
  reservationExtraInfo: any,        // JSON
  customerSignatureId?: string,     // '', 'xxxxx.png'
  hotel: string                     // 'HKI2', 'TKU1', 'TKU2', 'VSA2', 'HKI3', 'TRE2', 'POR2', 'JYL1', 'VSA1'
  updated: string                   // Timestamp of latest update
}

export type MinimalReservation = {
  id: number,
  checkIn: string,       // '2020-09-12 13:00:00'
  checkOut: string,      // '2020-09-13 09:00:00'
  hotel: string,
  state: string,
  marketingPermission: boolean,
  updated: string
}

const reservationInt = new Set([
  "id", "version", "reservationCode", "hotelId", "type",
])

const reservationFloats = new Set([
  "totalPaid",
  "totalPaidExtraForOta"
])

const reservationBools = new Set([
  "cancelled", "notifyCustomer", "isOverrided",
  "marketingPermission", "breakfastsForAll",
  "isFullyRefunded"
])

const timestampsWithoutTimezone = new Set([
  "created", "pendingConfirmationSince", "checkIn", "checkOut", "confirmed"
])

export const mapReservationValue = (props: { header: string, value: string }): boolean | string | number | undefined | object => {
  const value = props.value.trim()
  if (value === '') {
    return
  }
  if (props.header === 'reservationExtraInfo') {
    try {
      return JSON.parse(value)
    } catch (_) {
      return {}
    }
  }
  if (timestampsWithoutTimezone.has(props.header)) {
    return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
  }
  if (reservationInt.has(props.header)) {
    return parseInt(value, 10)
  }
  if (reservationFloats.has(props.header)) {
    return parseFloat(value)
  }
  if (reservationBools.has(props.header)) {
    return value === "TRUE" || value === "t" || value === "T" ? true : false
  }
  if (props.header === "customerMobile") {
    return value.replace(/ /g, "").replace(/ /g, "").replace(/^0/, "+358")
  }
  return value
}


export const isMatch = (r1: Reservation, r2: Reservation): boolean => {
  return r1.customerSsn === r2.customerSsn || r1.customerEmailReal === r2.customerEmailReal ||
    r1.customerMobile === r2.customerMobile
}

/**
 * Creates new customer from first reservation
 * @param r Reservation to create the customer from
 * @returns New customer
 */
export const createCustomerFromReservation = (r: Reservation): Customer | undefined => {
  if (r.customerSsn || r.customerEmailReal || r.customerMobile) {
    const bookingTotalNights = Math.round(dayjs(r.checkOut).diff(r.checkIn, "hours") / 24)
    const leadTimeDays = RoundToTwo(Math.max(0, dayjs(r.checkIn).diff(r.created, "hours") / 24))
    const { weekendDays, weekDays } = calculateDaysBetween(r.checkIn, r.checkOut)
    return {
      id: `R-${r.id}`,
      ssn: r.customerSsn,
      email: r.customerEmailReal,
      firstName: r.customerFirstName,
      lastName: r.customerLastName,
      phoneNumber: r.customerMobile,
      dateOfBirth: r.customerDateOfBirth,
      isoCountryCode: r.customerIsoCountryCode,
      includesChildren: false,
      level: 'New',
      lifetimeSpend: r.totalPaid,

      bookingNightsCounts: [bookingTotalNights],
      bookingPeopleCounts: [1],
      bookingLeadTimesDays: [leadTimeDays],

      avgBookingsPerYear: 1,
      avgBookingFrequencyDays: 0,
      avgNightsPerBooking: bookingTotalNights,
      avgPeoplePerBooking: 1,
      avgLeadTimeDays: leadTimeDays,

      firstCheckInDate: r.checkIn,
      latestCheckInDate: r.checkIn,
      latestCheckOutDate: r.checkOut,
      latestHotel: r.hotel,

      totalBookingComBookings: r.bookingChannel === "BOOKINGCOM" ? 1 : 0,
      totalExpediaBookings: r.bookingChannel === "EXPEDIA" ? 1 : 0,
      totalNelsonBookings: r.bookingChannel === "NELSON" ? 1 : 0,
      totalMobileAppBookings: r.bookingChannel === "MOBILEAPP" ? 1 : 0,

      totalLeisureBookings: r.customerPurposeOfVisit === "LEISURE" ? 1 : 0,
      totalBusinessBookings: r.customerPurposeOfVisit === "BUSINESS" ? 1 : 0,

      totalBookingsAsGuest: 0,
      totalBookings: 1,
      totalBookingCancellations: r.state === "CANCELLED" ? 1 : 0,
      totalBookingsPending: r.state === "PENDING_CONFIRMATION" ? 1 : 0,
      blocked: r.state === "BLOCKED",

      totalWeekDays: weekDays,
      totalWeekendDays: weekendDays,

      totalHotelBookingCounts: [{ hotel: r.hotel, count: 1 }],

      marketingPermission: r.marketingPermission,

      profileIds: [{ id: r.id, type: "Reservation" }],

      city: r.customerCity,
      streetAddress: r.customerAddress,

      updated: r.updated
    }
  }
}

/**
 * Completements customer information with new reservation information
 * @param c Existing customer
 * @param r New reservation
 * @returns Customer with updated information
 */
export const mergeReservationToCustomer = (c: Customer, r: Reservation): Customer => {
  const nc = createCustomerFromReservation(r)
  if (!nc) {
    return c
  }
  const firstCheckInDate = nc.firstCheckInDate.localeCompare(c.firstCheckInDate) < 0 ? nc.firstCheckInDate : c.firstCheckInDate
  const avgBookingsPerYear = RoundToTwo((c.totalBookings + 1) / (dayjs(r.checkIn).diff(firstCheckInDate, "years") + 1))

  if (!avgBookingsPerYear) {
    throw Error(JSON.stringify(c, null, 2))
  }
  const avgBookingFrequencyDays = RoundToTwo(dayjs(r.checkIn).diff(firstCheckInDate, "days") / c.totalBookings)

  const avgNightsPerBooking = RoundToTwo((c.avgNightsPerBooking * c.totalBookings + nc.avgNightsPerBooking) / (c.totalBookings + 1))

  const avgLeadTimeDays = RoundToTwo((c.bookingLeadTimesDays.reduce((t, c) => t + c, 0) +
    nc.avgLeadTimeDays) / (c.bookingLeadTimesDays.length + 1))

  const avgPeoplePerBooking = RoundToTwo((c.bookingPeopleCounts.reduce((t, c) => t + c, 0) + 1) / (c.totalBookings + 1))

  return {
    ...c,
    email: nc.email || c.email,
    firstName: nc.firstName || c.firstName,
    lastName: nc.lastName || c.lastName,
    phoneNumber: nc.phoneNumber || c.phoneNumber,
    dateOfBirth: c.dateOfBirth || nc.dateOfBirth,
    isoCountryCode: c.isoCountryCode || nc.dateOfBirth,
    level: c.level === 'Guest' ? 'New' : c.level,
    lifetimeSpend: c.lifetimeSpend + nc.lifetimeSpend,

    bookingNightsCounts: c.bookingNightsCounts.concat(nc.bookingNightsCounts),
    bookingPeopleCounts: c.bookingPeopleCounts.concat(nc.bookingPeopleCounts),
    bookingLeadTimesDays: c.bookingLeadTimesDays.concat(nc.bookingLeadTimesDays),
    includesChildren: c.includesChildren || nc.includesChildren,

    avgBookingsPerYear,
    avgBookingFrequencyDays,
    avgNightsPerBooking,
    avgPeoplePerBooking,
    avgLeadTimeDays,

    firstCheckInDate,
    latestCheckInDate: nc.latestCheckInDate.localeCompare(c.latestCheckInDate) > 0 ? nc.latestCheckInDate : c.latestCheckInDate,
    latestCheckOutDate: nc.latestCheckOutDate.localeCompare(c.latestCheckOutDate) > 0 ? nc.latestCheckOutDate : c.latestCheckOutDate,
    latestHotel: nc.latestCheckInDate.localeCompare(c.latestCheckInDate) > 0 ? nc.latestHotel : c.latestHotel,

    totalBookingComBookings: c.totalBookingComBookings + nc.totalBookingComBookings,
    totalExpediaBookings: c.totalExpediaBookings + nc.totalExpediaBookings,
    totalNelsonBookings: c.totalNelsonBookings + nc.totalNelsonBookings,
    totalMobileAppBookings: c.totalMobileAppBookings + nc.totalMobileAppBookings,

    totalLeisureBookings: c.totalLeisureBookings + nc.totalLeisureBookings,
    totalBusinessBookings: c.totalBookingComBookings + nc.totalBusinessBookings,

    totalBookingsAsGuest: c.totalBookingsAsGuest,
    totalBookings: c.totalBookings + 1,
    totalBookingCancellations: c.totalBookingCancellations + nc.totalBookingCancellations,

    blocked: c.blocked || nc.blocked,

    totalWeekDays: c.totalWeekDays + nc.totalWeekDays,
    totalWeekendDays: c.totalWeekendDays + nc.totalWeekendDays,

    totalHotelBookingCounts: mergeHotelCounts(c.totalHotelBookingCounts, nc.totalHotelBookingCounts),

    marketingPermission: nc.marketingPermission,

    profileIds: [...c.profileIds, ...nc.profileIds],

    updated: maxTimestamp(c.updated, nc.updated)
  }
}