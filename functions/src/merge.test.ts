import { Customer } from "./customer";
import { CustomerMerger } from "./merge";
import { createCustomerFromReservation, isMatch } from "./reservation";
import "jest"
import { generateNewGuest, generateNewReservation } from "./test/utils";
import dayjs from "dayjs";

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
    expect(guestCustomer.totalGuestBookings).toBe(1)
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
    expect(gc.totalGuestBookings).toBe(1)
    expect(gc.totalHotelBookingCounts).toEqual([{ hotel: 'HKI2', count: 1 }])
  })
});