import { createHash } from 'crypto'
import dayjs from 'dayjs'
import { createReadStream } from 'fs'
import { writeFileSync } from 'fs'
const csv = require('csv-parser')

export const loadCsv = async <T>(filename: string, mapValues?: (props: { header: string, value: string }) => any): Promise<T[]> => {
  return await new Promise((resolve, reject) => {
    const results: T[] = []
    createReadStream(filename)
      .pipe(csv({ mapHeaders: ({ header }: { header: string }) => camelize(header), mapValues }))
      .on('error', (error: any) => reject(error))
      .on('data', (data: any) => results.push(data))
      .on('end', () => {
        resolve(results)
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