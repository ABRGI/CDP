

export type Customer = {
  id: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  streetAddress?: string
  city?: string
  isoCountryCode?: string                                      // ISO country code, e.g. FI
  includesChildren: boolean
  level: 'VIP' | 'Loyal' | 'Passive' | 'Risk' | 'New'
  lifetimeSpend: number                                 // In euros

  avgBookingsPerYear: number
  avgBookingFrequencyDays: number
  avgNightsPerBooking: number
  avgPeoplePerBooking: number
  avgLeadTimeDays: number

  latestCheckInDate: string     // YYYY-MM-DD
  latestCheckOutDate: string    // YYYY-MM-DD
  latestHotel: string           // HKI2

  totalDiscountBookings: number

  totalBookingComBookings: number
  totalExpediaBookings: number
  totalNelsonBookings: number
  totalMobileAppBookings: number

  totalLeisureBookings: number
  totalBusinessBookings: number

  totalRefunds: number
  totalReclamations: number

  totalNightBookings: number    // 00-06
  totalMorningBookings: number  // 06-12
  totalDayBookings: number      // 12-18
  totalEveningBookings: number   // 18-24

  totalGuestBookings: number
  totalBookings: number

  blocked: boolean

  feedbacklyScores: number[]

  weekdayPercentage: number   // 0-100%
  weekendPercentage: number   // 0-100%

  totalHotelBookingCounts: { hotel: string, count: number }[]

  marketingPermission: boolean
}


