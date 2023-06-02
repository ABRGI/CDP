import dayjs from "dayjs"
import { Customer } from "./customer"
import { createHashId } from "./utils"

export type Reservation = {
  id: number,
  version: number
  reservationCode: number,
  uuid: string,
  hotelId: number,
  lang: string,                   // 'en', 'fi', 'ru', 'sv', 'et'
  totalPaid: number,
  currency: string,               // EUR (only)
  customerFirstName: string,
  customerLastName: string,
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
  state: string              // 'CONFIRMED', 'CANCELLED', 'PENDING_CONFIRMATION', 'BLOCKED'
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
}

const reservationInt = new Set([
  "id", "version", "reservationCode", "hotelId", "type",
])

const reservationFloats = new Set([
  "totalPaid",
  "totalPaidExtraForOta"
])

const reservationBools = new Set([
  "cancelled", "isFullyRefunded", "notifyCustomer", "isOverrided",
  "marketingPermission", "breakfastsForAll"
])

export const mapReservationValue = (props: { header: string, value: string }): boolean | string | number | undefined => {
  if (props.value === '') {
    return
  }
  if (props.header === 'reservationExtraInfo') {
    return JSON.parse(props.value)
  }
  if (reservationInt.has(props.header)) {
    return parseInt(props.value, 10)
  }
  if (reservationFloats.has(props.header)) {
    return parseFloat(props.value)
  }
  if (reservationBools.has(props.header)) {
    return props.value === "TRUE"
  }
  return props.value
}


export const isMatch = (r1: Reservation, r2: Reservation): boolean => {
  return r1.customerSsn === r2.customerSsn || r1.customerEmailReal === r2.customerEmailReal ||
    r1.customerMobile === r2.customerMobile
}


export const createCustomerFromReservation = (r: Reservation): Customer | undefined => {
  if (r.customerSsn || r.customerEmailReal || r.customerMobile) {
    const checkInDay = dayjs(r.checkIn).day()
    const weekend = checkInDay === 0 || checkInDay === 6
    return {
      id: createHashId(`${r.id}`),
      dateOfBirth: r.customerDateOfBirth,
      isoCountryCode: r.customerIsoCountryCode,
      includesChildren: false,
      level: 'New',
      lifetimeSpend: r.totalPaid,

      avgBookingsPerYear: 1,
      avgBookingFrequencyDays: 0,
      avgNightsPerBooking: 0,
      avgPeoplePerBooking: 0,
      avgLeadTimeDays: 0,

      latestCheckInDate: r.checkIn,
      latestCheckOutDate: r.checkOut,
      latestHotel: r.hotel,

      totalDiscountBookings: 0,

      totalBookingComBookings: r.bookingChannel === "BOOKINGCOM" ? 1 : 0,
      totalExpediaBookings: r.bookingChannel === "EXPEDIA" ? 1 : 0,
      totalNelsonBookings: r.bookingChannel === "NELSON" ? 1 : 0,
      totalMobileAppBookings: r.bookingChannel === "MOBILEAPP" ? 1 : 0,

      totalLeisureBookings: r.customerPurposeOfVisit === "LEISURE" ? 1 : 0,
      totalBusinessBookings: r.customerPurposeOfVisit === "BUSINESS" ? 1 : 0,

      totalRefunds: r.isFullyRefunded ? 1 : 0,
      totalReclamations: r.isFullyRefunded ? 1 : 0,

      totalNightBookings: 0,
      totalMorningBookings: 0,
      totalDayBookings: 0,
      totalEveningBookings: 0,

      totalGuestBookings: 0,
      totalBookings: 1,

      blocked: false,

      feedbacklyScores: [],

      weekdayPercentage: weekend ? 0 : 1,
      weekendPercentage: weekend ? 1 : 0,

      totalHotelBookingCounts: [{ hotel: r.hotel, count: 1 }],

      marketingPermission: r.marketingPermission
    }
  }
  return
}