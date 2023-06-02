import { Reservation, mapReservationValue } from "../reservation"
import { v4 as uuidv4 } from 'uuid'
import { getRandomInt, loadCsv, writeCsv } from "../utils"
import dayjs from "dayjs"
import { Guest, mapGuestValue } from "../guest"

let nextReservationId = 12201891

const characters = 'abcdefghijklmnopqrstuvwxyz';

const getRandomCharacter = (): string => {
  return characters[getRandomInt(0, characters.length - 1)]
}

const generateRandomString = (length: number): string => {
  let retval = ""
  for (let i = 0; i < length; i++) {
    retval += getRandomCharacter()
  }
  return retval
}

const getNextReservationId = (): number => {
  nextReservationId++
  return nextReservationId - 1
}

const generateFirstName = (): string => {
  return generateRandomString(getRandomInt(3, 8))
}

const generateLastName = (): string => {
  return generateRandomString(getRandomInt(5, 12))
}

const generatePhoneNumber = (): string => {
  return "+358" + getRandomInt(10000000, 1000000000).toString()
}

const generateBirthDate = (adult: boolean): string => {
  return dayjs()
    .subtract(getRandomInt(adult ? 18 : 1, 99), "years")
    .subtract(getRandomInt(0, 366), "days").format("YYYY-MM-DD")
}

const generateEmail = (): string => {
  const domains = ["gmail.com", "hotmail.com", "luukku.com", "firma.fi", "msn.com"]
  return generateHash() + "@" + domains[getRandomInt(0, domains.length - 1)]
}

const generateHash = (): string => {
  return uuidv4()
}

const generateCompanyName = (): string => {
  return "Yritys " + ([1, 2, 3, 4].map(() => getRandomCharacter()).join(""))
}

const generateStreetAddress = (): string => {
  return generateRandomString(15) + " " + getRandomInt(1, 100).toString()
}

const generateNewCustomerRow = (sampleRows: Reservation[]): Reservation => {
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
      generateNewCustomerRow(sampleRows)
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