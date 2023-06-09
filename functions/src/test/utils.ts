import dayjs from "dayjs";
import { createHashId, getRandomInt } from "../utils";
import { v4 as uuidv4 } from 'uuid'
import { Reservation } from "../reservation";

let nextReservationId = 12201891

const characters = 'abcdefghijklmnopqrstuvwxyz';

export const getRandomCharacter = (): string => {
  return characters[getRandomInt(0, characters.length - 1)]
}

export const generateRandomString = (length: number): string => {
  let retval = ""
  for (let i = 0; i < length; i++) {
    retval += getRandomCharacter()
  }
  return retval
}

export const getNextReservationId = (): number => {
  nextReservationId++
  return nextReservationId - 1
}

export const generateFirstName = (): string => {
  return generateRandomString(getRandomInt(3, 8))
}

export const generateLastName = (): string => {
  return generateRandomString(getRandomInt(5, 12))
}

export const generatePhoneNumber = (): string => {
  return "+358" + getRandomInt(10000000, 1000000000).toString()
}

export const generateBirthDate = (adult: boolean): string => {
  return dayjs()
    .subtract(getRandomInt(adult ? 18 : 1, 99), "years")
    .subtract(getRandomInt(0, 366), "days").format("YYYY-MM-DD")
}

export const generateEmail = (): string => {
  const domains = ["gmail.com", "hotmail.com", "luukku.com", "firma.fi", "msn.com"]
  return generateHash() + "@" + domains[getRandomInt(0, domains.length - 1)]
}

export const generateHash = (): string => {
  return uuidv4()
}

export const generateCompanyName = (): string => {
  return "Yritys " + ([1, 2, 3, 4].map(() => getRandomCharacter()).join(""))
}

export const generateStreetAddress = (): string => {
  return generateRandomString(15) + " " + getRandomInt(1, 100).toString()
}


export const generateNewReservation = (): Reservation => {
  const checkIn = dayjs().subtract(getRandomInt(1, 500))
  const checkOut = dayjs(checkIn).add(getRandomInt(1, 5), "days")
  const leadDays = getRandomInt(1, 14)
  const leadDate = dayjs(checkIn).subtract(leadDays, "days")
  return {
    id: getNextReservationId(),
    version: 2,
    reservationCode: getNextReservationId(),
    uuid: uuidv4(),
    hotelId: 3,
    lang: "fi",
    totalPaid: 99,
    currency: "EUR",
    customerFirstName: generateFirstName(),
    customerLastName: generateLastName(),
    customerMobile: generatePhoneNumber(),
    customerAddress: generateStreetAddress(),
    customerPostalCode: "00100",
    customerCity: "sr.customerCity",
    customerSsn: generateHash(),
    customerDateOfBirth: generateBirthDate(true),
    customerPurposeOfVisit: "LEISURE",
    customerNationality: "FIN",
    companyName: generateCompanyName(),
    companyReference: undefined,
    bookingChannel: "MOBILEAPP",
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
    breakfastsForAll: false,
    customerIsoCountryCode: "FIN",
    reservationExtraInfo: {},
    hotel: "HKI2"
  }
}