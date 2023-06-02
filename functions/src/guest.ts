import dayjs from "dayjs"
import { Customer } from "./customer"
import { Reservation } from "./reservation"
import { createHashId } from "./utils"

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
  passportNumber?: undefined,
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
  if (props.value === '') {
    return
  }
  if (guestInt.has(props.header)) {
    return parseInt(props.value, 10)
  }
  if (guestBools.has(props.header)) {
    return props.value === "TRUE"
  }
  return props.value
}

export const isGuestMatch = (r1: Guest, r2: Guest): boolean => {
  return r1.ssn === r2.ssn || r1.email === r2.email ||
    r1.mobile === r2.mobile
}


export const createCustomerFromGuest = (r: Reservation, g: Guest): Customer | undefined => {
  if (g.ssn || g.email || g.mobile) {
    const checkInDay = dayjs(r.checkIn).day()
    const weekend = checkInDay === 0 || checkInDay === 6
    return {
      id: createHashId(`${r.id}-${g.id}`),
      dateOfBirth: g.dateOfBirth,
      isoCountryCode: g.isoCountryCode,
      includesChildren: false,
      level: 'New',
      lifetimeSpend: 0.0,

      avgBookingsPerYear: 0,
      avgBookingFrequencyDays: 0,
      avgNightsPerBooking: 0,
      avgPeoplePerBooking: 0,
      avgLeadTimeDays: 0,

      latestCheckInDate: r.checkIn,
      latestCheckOutDate: r.checkOut,
      latestHotel: r.hotel,

      totalDiscountBookings: 0,

      totalBookingComBookings: 0,
      totalExpediaBookings: 0,
      totalNelsonBookings: 0,
      totalMobileAppBookings: 0,

      totalLeisureBookings: 0,
      totalBusinessBookings: 0,

      totalRefunds: 0,
      totalReclamations: 0,

      totalNightBookings: 0,
      totalMorningBookings: 0,
      totalDayBookings: 0,
      totalEveningBookings: 0,

      totalGuestBookings: 1,
      totalBookings: 0,

      blocked: false,

      feedbacklyScores: [],

      weekdayPercentage: weekend ? 0 : 1,
      weekendPercentage: weekend ? 1 : 0,

      totalHotelBookingCounts: [],

      marketingPermission: g.marketingPermission
    }
  }
  return
}