import dayjs from "dayjs";
import { getRandomInt } from "./utils";
import { v4 as uuidv4 } from 'uuid'

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