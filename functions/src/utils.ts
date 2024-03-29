import { createHash } from 'crypto'
import dayjs from 'dayjs'
import { createReadStream } from 'fs'
import { writeFileSync } from 'fs'
const csv = require('csv-parser')

export const loadCsv = async <T>(filename: string,
  mapValues?: (props: { header: string, value: string }) => any, defaults?: { [key: string]: any },
  separator: string = ','): Promise<T[]> => {
  return await new Promise((resolve, reject) => {
    const results: T[] = []
    createReadStream(filename)
      .pipe(csv({ separator, mapHeaders: ({ header }: { header: string }) => camelize(header), mapValues }))
      .on('error', (error: any) => reject(error))
      .on('data', (data: any) => results.push({ ...data, ...defaults }))
      .on('end', () => {
        resolve(results)
      });
  })
}

export const streamCsv = async <T>(filename: string,
  handleData: (row: T) => void,
  mapValues?: (props: { header: string, value: string }) => any): Promise<void> => {
  return await new Promise((resolve, reject) => {
    createReadStream(filename)
      .pipe(csv({ mapHeaders: ({ header }: { header: string }) => camelize(header), mapValues }))
      .on('error', (error: any) => reject(error))
      .on('data', (row: T) => handleData(row))
      .on('end', () => {
        resolve()
      });
  })
}

export const camelize = (str: string): string => {
  return str.replace(/_/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}


export const getRandomInt = (min: number, max: number): number => {
  return Math.round(Math.random() * (max - min) + min)
}

export const writeCsv = <T>(rows: T[], filename: string) => {
  const lines = [Object.keys(rows[0] as any).join(",")]
  for (const row of rows) {
    lines.push(Object.values(row as any).join(","))
  }
  writeFileSync(filename, lines.join("\n"))
}

export const createHashId = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Round given numeric value to two decimals
 * @param value Number to round
 */
export const RoundToTwo = (value: number): number => {
  return Math.round(value * 100) / 100.0
}

/**
 * Calculates number of weekend and week days in between to dates
 * @param startdate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export const calculateDaysBetween = (startDate: string, endDate: string): { weekendDays: number, weekDays: number, totalDays: number } => {
  let weekendDays = 0
  let weekDays = 0
  let currDate = dayjs(startDate)
  while (!currDate.isAfter(endDate)) {
    if (currDate.day() <= 1) {
      weekendDays++
    } else {
      weekDays++
    }
    currDate = currDate.add(1, "day")
  }
  return { weekendDays, weekDays, totalDays: Math.round(dayjs(endDate).diff(startDate, "hours") / 24) }
}

/**
 * Draws random item from given array
 * @param array Array to draw the random item from
 * @returns random item
 */
export const getRandomFrom = <T>(array: T[]): T => {
  return array[getRandomInt(0, array.length - 1)]
}

function distanceMax(a: string, b: string, currDis: number, aStart: number, bStart: number, maxDistance: number): boolean {
  if (currDis > maxDistance) return true
  if (aStart >= a.length) return currDis + (b.length - bStart) > maxDistance
  if (bStart >= b.length) return currDis + (a.length - aStart) > maxDistance
  if (a.charCodeAt(aStart) === b.charCodeAt(bStart))
    return distanceMax(a, b, currDis, aStart + 1, bStart + 1, maxDistance)
  return distanceMax(a, b, currDis + 1, aStart + 1, bStart, maxDistance) &&
    distanceMax(a, b, currDis + 1, aStart, bStart + 1, maxDistance) &&
    distanceMax(a, b, currDis + 1, aStart + 1, bStart + 1, maxDistance)
}

/**
 * Calculates if string Levehstein distance is more than given max distance
 * @param a First string to calculate distance for
 * @param b Second string to  calculate distance for
 * @param maxDistance Maximum allowed distance
 * @returns If distance is equal or less than maximum distance this will return true, otherwise false
 */
export const distanceMoreThan = (a: string, b: string, maxDistance: number): boolean => {
  return distanceMax(a, b, 0, 0, 0, maxDistance)
}


/**
 * Returns later timestamp
 * @param a e.g. 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
 * @param b e.g. 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
 * @returns
 */
export const maxTimestamp = (a: string | undefined, b: string | undefined): string | undefined => {
  if (!a) return b
  if (!b) return a
  if (!a && !b) return
  return a.localeCompare(b) > 0 ? a : b;
}

/**
 * Returns earlier timestamp
 * @param a e.g. 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
 * @param b e.g. 'YYYY-MM-DDTHH:mm:ss.SSSZZ'
 * @returns
 */
export const minTimestamp = (a: string | undefined, b: string | undefined): string | undefined => {
  if (!a) return b
  if (!b) return a
  if (!a && !b) return
  return a.localeCompare(b) < 0 ? a : b;
}

/**
 * Splits array to chunks of given size
 * @param chunkSize Size of chunk
 * @param arr Array to split
 * @returns Chunks
 */
export const splitToChunks = <T>(chunkSize: number, arr: T[]): T[][] => {
  return arr.reduce((all, current) => {
    if (all[all.length - 1].length >= chunkSize) {
      all.push([])
    }
    all[all.length - 1].push(current)
    return all
  }, [[]] as T[][])
}

export const timestampFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ'


export const escapeString = (str: string): string => {
  return str.replace(/'/g, `\\'`)
}

export const arrayToMap = <T>(keyName: string, array: any[]): { [key: string]: T } => {
  const map: { [key: string]: T } = {}
  for (const item of array) {
    map[item[keyName]] = item
  }
  return map
}

export const sleep = async (milliSeconds: number): Promise<void> => {
  await new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(undefined)
    }, milliSeconds)
  })
}

export const splitIntoChunks = (array: any[], chunkSize: number): any[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}