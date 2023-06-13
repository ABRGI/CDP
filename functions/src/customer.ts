

export type Customer = {
  id: string
  ssn?: string
  email?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  streetAddress?: string
  city?: string
  isoCountryCode?: string                                      // ISO country code, e.g. FI
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

  totalBookingsAsGuest: number
  totalBookings: number

  blocked: boolean

  totalWeekDays: number
  totalWeekendDays: number

  totalHotelBookingCounts: { hotel: string, count: number }[]

  marketingPermission: boolean
}


