import { Reservation, mapReservationValue } from "../reservation"
import { v4 as uuidv4 } from 'uuid'
import { getRandomInt, loadCsv, writeCsv } from "../utils"
import dayjs from "dayjs"
import { Guest } from "../guest"
import { generateBirthDate, generateCompanyName, generateEmail, generateFirstName, generateHash, generateLastName, generatePhoneNumber, generateStreetAddress, getNextReservationId } from "../test/utils"



const generateReservationRow = (sampleRows: Reservation[]): Reservation => {
  const si = getRandomInt(0, sampleRows.length - 1)
  const sr = sampleRows[si]

  const checkIn = dayjs().subtract(getRandomInt(1, 800), "days")
  const checkOut = dayjs(checkIn).add(getRandomInt(1, 4), "days")
  const leadDays = getRandomInt(1, 14)
  const leadDate = dayjs(checkIn).subtract(getRandomInt(0, leadDays), "days")
  return {
    id: getNextReservationId(),
    version: 2,
    reservationCode: getNextReservationId(),
    uuid: uuidv4(),
    hotelId: 3,
    lang: sr.lang,
    totalPaid: sr.totalPaid,
    currency: "EUR",
    customerFirstName: generateFirstName(),
    customerLastName: generateLastName(),
    customerMobile: generatePhoneNumber(),
    customerAddress: generateStreetAddress(),
    customerPostalCode: sr.customerPostalCode,
    customerCity: sr.customerCity,
    customerSsn: sr.customerSsn ? generateHash() : undefined,
    customerDateOfBirth: sr.customerDateOfBirth ? generateBirthDate(true) : undefined,
    customerPurposeOfVisit: sr.customerPurposeOfVisit,
    customerNationality: sr.customerNationality,
    companyName: sr.companyName ? generateCompanyName() : undefined,
    companyReference: undefined,
    bookingChannel: sr.bookingChannel,
    bookingChannelReservationId: undefined,
    checkIn: checkIn.format("YYYY-MM-DD HH:mm:ss"),
    checkOut: checkOut.format("YYYY-MM-DD HH:mm:ss"),
    created: leadDate.format("YYYY-MM-DD"), // YYYY-MM-DD
    confirmed: leadDate.add(getRandomInt(0, leadDays - 1)).format("YYYY-MM-DD"),
    cancelled: false,
    isFullyRefunded: false,
    pendingConfirmationSince: "",
    changeType: "",
    state: "CONFIRMED",
    notifyCustomer: false,
    isOverrided: false,
    type: 1,
    modifiedBy: "modifier@huolto.com",
    marketingPermission: true,
    customerEmailReal: generateEmail(),
    customerEmailVirtual: "",
    totalPaidExtraForOta: 0,
    breakfastsForAll: sr.breakfastsForAll,
    customerIsoCountryCode: sr.customerIsoCountryCode,
    cancellationReason: sr.cancellationReason,
    reservationExtraInfo: {},
    hotel: sr.hotel
  }
}

const generateExistingCustomerRow = (customer: Reservation, sampleRows: Reservation[]): Reservation => {
  const si = getRandomInt(0, sampleRows.length - 1)
  const sr = sampleRows[si]

  const checkIn = dayjs().subtract(getRandomInt(1, 800), "days")
  const checkOut = dayjs(checkIn).add(getRandomInt(1, 4), "days")
  const leadDays = getRandomInt(1, 14)
  const leadDate = dayjs(checkIn).subtract(getRandomInt(0, leadDays), "days")
  return {
    ...customer,
    id: getNextReservationId(),
    version: 2,
    reservationCode: getNextReservationId(),
    uuid: uuidv4(),
    lang: customer.lang,
    totalPaid: sr.totalPaid,
    customerPurposeOfVisit: sr.customerPurposeOfVisit,
    bookingChannel: sr.bookingChannel,
    checkIn: checkIn.format("YYYY-MM-DD HH:mm:ss"),
    checkOut: checkOut.format("YYYY-MM-DD HH:mm:ss"),
    created: leadDate.format("YYYY-MM-DD"), // YYYY-MM-DD
    confirmed: leadDate.add(getRandomInt(0, leadDays - 1)).format("YYYY-MM-DD"),
    state: "CONFIRMED",
    modifiedBy: "modifier@huolto.com",
    marketingPermission: true,
    breakfastsForAll: sr.breakfastsForAll,
    reservationExtraInfo: {},
    hotel: Math.random() < 0.5 ? sr.hotel : customer.hotel
  }
}

const generateGuestRow = (customer: Reservation): Guest => {
  return {
    id: getNextReservationId(),
    reservationId: customer.reservationCode,
    roomAlias: 1,
    guestIndex: 1,
    firstName: generateFirstName(),
    lastName: generateLastName(),
    nationality: customer.customerNationality,
    dateOfBirth: generateBirthDate(false),
    marketingPermission: customer.marketingPermission,
    isoCountryCode: customer.customerIsoCountryCode
  }
}

export const generateTestData = async (sampleFilename: string,
  count: number): Promise<{ reservations: Reservation[], guests: Guest[] }> => {
  const sampleRows = await loadCsv<Reservation>(sampleFilename, mapReservationValue)

  const reservations: Reservation[] = []
  const guests: Guest[] = []
  for (let i = 0; i < count; i++) {
    const reservation = Math.random() < 0.1 ? generateExistingCustomerRow(reservations[getRandomInt(0, reservations.length - 1)], sampleRows) :
      generateReservationRow(sampleRows)
    reservations.push(reservation)
    if (Math.random() > 0.5) {
      guests.push(generateGuestRow(reservation))
    }
  }
  return {
    reservations,
    guests
  }
}

generateTestData("test-data/reservations_sample_05312023.csv",
  1000000).then(({ reservations, guests }) => {
    writeCsv(reservations, "reservations-test-data.csv")
    writeCsv(guests, "guests-test-data.csv")
  })