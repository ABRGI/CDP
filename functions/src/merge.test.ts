import { Customer } from "./customer";
import { CustomerMerger } from "./merge";
import { Reservation, createCustomerFromReservation, isMatch, mapReservationValue } from "./reservation";
import "jest"
import { generateNewGuest, generateNewReservation } from "./test/utils";
import dayjs from "dayjs";
import { loadCsv } from "./utils";
import { Guest, mapGuestValue } from "./guest";

describe('Merge tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('Creating new customers', () => {
    const merger = new CustomerMerger()
    merger.addReservation(generateNewReservation())
    merger.addReservation(generateNewReservation())
    merger.addReservation(generateNewReservation())

    expect(Object.keys(merger.customers).length).toBe(3)
  })

  test('Merging reservations to customer by SSN', () => {
    const reservation = generateNewReservation()
    const reservation2 = {
      ...generateNewReservation(), customerSsn: reservation.customerSsn,
      hotel: reservation.hotel
    }
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation(reservation2)

    const customers = merger.getCustomers()
    expect(customers.length).toBe(1)

    const customerR1 = createCustomerFromReservation(reservation)
    const customerR2 = createCustomerFromReservation(reservation2)
    const customer = customers[0]
    expect(customer.bookingNightsCounts).toEqual([customerR1?.bookingNightsCounts[0], customerR2?.bookingNightsCounts[0]])
    expect(customer.bookingPeopleCounts).toEqual([customerR1?.bookingPeopleCounts[0], customerR2?.bookingPeopleCounts[0]])
    expect(customer.bookingLeadTimesDays.length).toBe(2)
    expect(customer.lifetimeSpend).toBe(198)
    expect(customer.avgPeoplePerBooking).toBe(1)

    expect(customer.totalBookings).toBe(2)
    expect(customer.totalHotelBookingCounts).toEqual([{ hotel: reservation.hotel, count: 2 }])
  })

  test('Merging reservations to customer by phonenumber', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({ ...generateNewReservation(), customerMobile: reservation.customerMobile })
    expect(Object.keys(merger.customers).length).toBe(1)
  })

  test('Merging reservations to customer by email', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({ ...generateNewReservation(), customerEmailReal: reservation.customerEmailReal })
    expect(Object.keys(merger.customers).length).toBe(1)
  })

  test('Adding child guest information to customer', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)

    const guest = generateNewGuest(reservation.id)
    guest.dateOfBirth = dayjs().subtract(3, 'year').format("YYYY-MM-DD")
    merger.addGuest(guest)

    const customers = merger.getCustomers()
    expect(customers.length).toBe(2)
    const customer = customers[0]

    expect(customer.includesChildren).toBe(true)
    expect(customer.bookingPeopleCounts).toEqual([2])

    const guestCustomer = customers[1]
    expect(guestCustomer.includesChildren).toBe(true)
    expect(guestCustomer.totalBookingsAsGuest).toBe(1)
    expect(guestCustomer.latestCheckInDate).toEqual(customer.latestCheckInDate)
    expect(guestCustomer.latestCheckOutDate).toEqual(customer.latestCheckOutDate)
    expect(guestCustomer.latestHotel).toEqual(customer.latestHotel)
    expect(guestCustomer.lifetimeSpend).toBeCloseTo(0)
    expect(guestCustomer.level).toEqual('Guest')
  })

  test('From guest to customer', () => {
    const merger = new CustomerMerger()

    const parent = generateNewReservation()
    parent.hotel = 'HKI1'
    merger.addReservation(parent)

    const guest = generateNewGuest(parent.id)
    guest.dateOfBirth = dayjs().subtract(20, 'year').format("YYYY-MM-DD")
    merger.addGuest(guest)

    expect(merger.getCustomers()[1].level).toEqual('Guest')

    const reservation = generateNewReservation()
    reservation.customerSsn = guest.ssn
    reservation.hotel = 'HKI2'
    merger.addReservation(reservation)

    const customers = merger.getCustomers()
    const gc = customers[1]
    expect(gc.totalBookings).toBe(1)
    expect(gc.totalBookingsAsGuest).toBe(1)
    expect(gc.totalHotelBookingCounts).toEqual([{ hotel: 'HKI2', count: 1 }])
    expect(gc.level).toEqual('New')
  })

  test('Should not update guest for booking customer', () => {
    const merger = new CustomerMerger()

    const reservation = generateNewReservation()
    merger.addReservation(reservation)
    const customer = merger.getCustomers()[0]

    const guest = generateNewGuest(reservation.id)
    guest.ssn = reservation.customerSsn
    merger.addGuest(guest)

    const customerUpd = merger.getCustomers()[0]
    expect(customer).toEqual(customerUpd)
  })

  test('Should update guest for customer not booking the reservation', () => {
    const merger = new CustomerMerger()

    const reservation = generateNewReservation()
    merger.addReservation(reservation)
    const customer = merger.getCustomers()[0]

    const guest = generateNewGuest(reservation.id)
    merger.addGuest(guest)

    const customerUpd = merger.getCustomers()[0]
    expect(customerUpd.bookingPeopleCounts).toEqual([2])
    expect(customer.bookingPeopleCounts).toEqual([1])
    expect({ ...customer, bookingPeopleCounts: [2] }).toEqual(customerUpd)

  })

  test('Basic metrics from several reservations', () => {
    const r1 = generateNewReservation()
    const r2 = generateNewReservation()

    r1.checkIn = "2023-03-01 14:00"
    r1.checkOut = "2023-03-03 12:00"
    r1.created = "2023-02-20"
    r1.hotel = "TKU1"
    r1.customerPurposeOfVisit = "LEISURE"

    r2.customerSsn = r1.customerSsn
    r2.checkIn = "2023-06-09 14:00"
    r2.checkOut = "2023-06-10 12:00"
    r2.created = "2023-06-04"
    r2.hotel = "TKU2"
    r2.customerPurposeOfVisit = "LEISURE"

    const merger = new CustomerMerger()
    merger.addReservation(r1)
    merger.addReservation(r2)

    const customers = merger.getCustomers()
    expect(customers.length).toBe(1)

    const customer = customers[0]
    expect(customer.avgBookingFrequencyDays).toBeCloseTo(100)
    expect(customer.avgBookingsPerYear).toBeCloseTo(2)
    expect(customer.lifetimeSpend).toBeCloseTo(198)
    expect(customer.bookingNightsCounts).toEqual([2, 1])
    expect(customer.bookingPeopleCounts).toEqual([1, 1])
    expect(customer.bookingLeadTimesDays).toEqual([10, 6])
    expect(customer.avgNightsPerBooking).toBeCloseTo(1.5)
    expect(customer.avgPeoplePerBooking).toBeCloseTo(1)
    expect(customer.avgLeadTimeDays).toBeCloseTo(8)
    expect(customer.latestHotel).toEqual(r2.hotel)
    expect(customer.totalWeekDays).toBe(3)
    expect(customer.totalWeekendDays).toBe(0)
    expect(customer.totalHotelBookingCounts).toEqual([{ hotel: "TKU1", count: 1 }, { hotel: "TKU2", count: 1 }])
    expect(customer.marketingPermission).toBe(true)

    const r3 = generateNewReservation()
    r3.customerSsn = r2.customerSsn
    r3.checkIn = "2024-08-01 14:00"
    r3.checkOut = "2024-08-07 12:00"
    r3.created = "2024-07-15"
    r3.hotel = "TKU2"
    r3.marketingPermission = false
    r3.customerPurposeOfVisit = "BUSINESS"
    merger.addReservation(r3)

    const customersUpd = merger.getCustomers()
    expect(customersUpd.length).toBe(1)

    const customerUpd = customersUpd[0]
    expect(customerUpd.avgBookingFrequencyDays).toBeCloseTo(259.5)
    expect(customerUpd.avgBookingsPerYear).toBeCloseTo(1.5)
    expect(customerUpd.lifetimeSpend).toBeCloseTo(297)
    expect(customerUpd.bookingNightsCounts).toEqual([2, 1, 6])
    expect(customerUpd.bookingPeopleCounts).toEqual([1, 1, 1])
    expect(customerUpd.bookingLeadTimesDays).toEqual([10, 6, 18])
    expect(customerUpd.avgNightsPerBooking).toBeCloseTo(3)
    expect(customerUpd.avgPeoplePerBooking).toBeCloseTo(1)
    expect(customerUpd.avgLeadTimeDays).toBeCloseTo(11.33)
    expect(customerUpd.firstCheckInDate).toEqual("2023-03-01 14:00")
    expect(customerUpd.latestCheckInDate).toEqual("2024-08-01 14:00")
    expect(customerUpd.latestCheckOutDate).toEqual("2024-08-07 12:00")
    expect(customerUpd.latestHotel).toEqual(r3.hotel)
    expect(customerUpd.totalWeekDays).toBe(7)
    expect(customerUpd.totalWeekendDays).toBe(2)
    expect(customerUpd.totalBookings).toBe(3)
    expect(customerUpd.totalLeisureBookings).toBe(2)
    expect(customerUpd.totalBusinessBookings).toBe(1)
    expect(customerUpd.totalHotelBookingCounts).toEqual([{ hotel: "TKU1", count: 1 }, { hotel: "TKU2", count: 2 }])
  })
});