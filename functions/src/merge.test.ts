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

  test('Merging reservations everything matches except SSN', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({
      ...generateNewReservation(),
      customerMobile: reservation.customerMobile,
      customerEmailReal: reservation.customerEmailReal,
      customerFirstName: reservation.customerFirstName,
      customerLastName: reservation.customerLastName,
      customerSsn: reservation.customerSsn + "_not_matching"
    })
    expect(Object.keys(merger.customers).length).toBe(1)
  })

  test('Merging reservations with partial match phonenumber and email', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({
      ...generateNewReservation(),
      customerMobile: reservation.customerMobile?.substring(1),
      customerEmailReal: reservation.customerEmailReal?.substring(1),
      customerFirstName: reservation.customerFirstName,
      customerLastName: reservation.customerLastName,
      customerSsn: undefined
    })
    expect(Object.keys(merger.customers).length).toBe(1)
  })

  test('Not merging reservations with too weak partial match for phonenumber and email', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({
      ...generateNewReservation(),
      customerMobile: reservation.customerMobile?.substring(2),
      customerEmailReal: reservation.customerEmailReal?.substring(2),
      customerFirstName: reservation.customerFirstName,
      customerLastName: reservation.customerLastName,
      customerSsn: undefined
    })
    expect(Object.keys(merger.customers).length).toBe(2)
  })

  test('Not merging reservations to customer by email only', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({
      ...generateNewReservation(),
      customerFirstName: undefined,
      customerLastName: undefined,
      customerSsn: undefined,
      customerMobile: undefined,
      customerEmailReal: reservation.customerEmailReal
    })
    expect(Object.keys(merger.customers).length).toBe(2)
  })

  test('Merging reservations to customer by SSN and partial match email', () => {
    const reservation = generateNewReservation()
    const merger = new CustomerMerger()
    merger.addReservation(reservation)
    merger.addReservation({
      ...generateNewReservation(),
      customerFirstName: undefined,
      customerLastName: undefined,
      customerSsn: reservation.customerSsn,
      customerMobile: undefined,
      customerEmailReal: reservation.customerEmailReal?.substring(1)
    })
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
    reservation.customerEmailReal = guest.email
    reservation.customerFirstName = undefined
    reservation.customerLastName = undefined
    reservation.customerMobile = undefined
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
    guest.guestIndex = 0
    guest.ssn = reservation.customerSsn
    guest.firstName = undefined
    guest.lastName = undefined
    guest.mobile = reservation.customerMobile
    guest.email = undefined
    merger.addGuest(guest)

    const customerUpd = merger.getCustomers()[0]
    expect(customer).toEqual(customerUpd)
  })

  test('Should increase total group bookings', () => {
    const merger = new CustomerMerger()

    const reservation = generateNewReservation()
    merger.addReservation(reservation)

    const guest = generateNewGuest(reservation.id)
    guest.guestIndex = 1
    guest.roomAlias = 2
    merger.addGuest(guest)

    const guest2 = generateNewGuest(reservation.id)
    guest2.guestIndex = 2
    guest2.roomAlias = 1
    merger.addGuest(guest2)

    const customer = merger.getCustomers()[0]
    expect(customer.totalGroupBookings).toEqual(1)
    expect(customer.bookingPeopleCounts).toEqual([3])
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
    expect({ ...customer, bookingPeopleCounts: [2], profileIds: [...customer.profileIds, { id: guest.id, type: "ReservationGuest" }] }).toEqual(customerUpd)

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
    r2.customerEmailReal = r1.customerEmailReal
    r2.customerFirstName = r1.customerFirstName
    r2.customerLastName = r1.customerLastName
    r2.customerMobile = r1.customerMobile
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
    expect(customer.bookingLeadTimesDays).toEqual([9.58, 5.58])
    expect(customer.avgNightsPerBooking).toBeCloseTo(1.5)
    expect(customer.avgPeoplePerBooking).toBeCloseTo(1)
    expect(customer.avgLeadTimeDays).toBeCloseTo(7.58)
    expect(customer.latestHotel).toEqual(r2.hotel)
    expect(customer.totalWeekDays).toBe(3)
    expect(customer.totalWeekendDays).toBe(0)
    expect(customer.totalHotelBookingCounts).toEqual([{ hotel: "TKU1", count: 1 }, { hotel: "TKU2", count: 1 }])
    expect(customer.marketingPermission).toBe(true)
    expect(customer.profileIds).toEqual([{ id: r1.id, type: "Reservation" }, { id: r2.id, type: "Reservation" }])
    expect(customer.isoCountryCode).toEqual("FIN")
    expect(customer.memberId).toEqual(1234)

    const r3 = generateNewReservation()
    r3.customerSsn = r2.customerSsn
    r3.customerEmailReal = r2.customerEmailReal
    r3.customerFirstName = r2.customerFirstName
    r3.customerLastName = r2.customerLastName
    r3.customerMobile = r2.customerMobile
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
    expect(customerUpd.bookingLeadTimesDays).toEqual([9.58, 5.58, 17.58])
    expect(customerUpd.avgNightsPerBooking).toBeCloseTo(3)
    expect(customerUpd.avgPeoplePerBooking).toBeCloseTo(1)
    expect(customerUpd.avgLeadTimeDays).toBeCloseTo(10.91)
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
    expect(customerUpd.profileIds).toEqual([
      { id: r1.id, type: "Reservation" },
      { id: r2.id, type: "Reservation" },
      { id: r3.id, type: "Reservation" }])
  })
});