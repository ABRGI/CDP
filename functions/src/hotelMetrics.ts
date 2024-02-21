import dayjs from "dayjs";
import { BigQuerySimple } from "./bigquery"
import { datasetId, googleProjectId } from "./env"

type HotelMetric = { [customerType: string]: { revenue: number, allocation: number } }

type HotelMetrics = { [date: string]: { [label: string]: HotelMetric } }

export const updateDayHotelMetrics = async (created: string): Promise<void> => {
  const bq = new BigQuerySimple(googleProjectId)

  const allocations = await bq.query<any>(datasetId, `SELECT * FROM allocations WHERE created <= '${created}'`)
  const createdDateOnly = dayjs(created).format("YYYY-MM-DD")

  const metrics: HotelMetrics = {}
  for (const alloc of allocations) {
    let startDate = dayjs(alloc.checkIn).endOf("day")
    let days = 0
    while (days < alloc.days) {
      const date = startDate.format("YYYY-MM-DD")
      if (!(date in metrics)) {
        metrics[date] = {}
      }
      if (!(alloc.hotel in metrics[date])) {
        metrics[date][alloc.hotel] = {}
      }
      if (!(alloc.type in metrics[date][alloc.hotel])) {
        metrics[date][alloc.hotel][alloc.type] = {
          revenue: 0,
          allocation: 0
        }
      }
      metrics[date][alloc.hotel][alloc.type].allocation += alloc.rooms
      metrics[date][alloc.hotel][alloc.type].revenue += alloc.totalPaid
      startDate = startDate.add(1, "day")
      days++
    }
  }

  const rows = []
  for (const date of Object.keys(metrics)) {
    for (const label of Object.keys(metrics[date])) {
      for (const customerType of Object.keys(metrics[date][label])) {
        const metric = metrics[date][label][customerType]
        rows.push({ created: createdDateOnly, date, label, customerType, revenue: metric.revenue, allocation: metric.allocation })
      }
    }
  }
  await bq.insert(datasetId, 'hotelMetrics', rows)
}

export const updateHotelMetrics = async (): Promise<void> => {
  const bq = new BigQuerySimple(googleProjectId)
  const dateResult = await bq.query<{ date: string }>(datasetId,
    `SELECT CAST(created AS STRING) as date FROM hotelMetrics ORDER BY date DESC`)
  const dates = new Set(dateResult.map(d => d.date))

  let currDate = dayjs().subtract(1, "days")
  const lastDate = dayjs().subtract(1, "months")
  let daysLoaded = 0
  while (currDate.isAfter(lastDate, "days") && daysLoaded < 2) {
    const dateStr = currDate.format("YYYY-MM-DD")
    if (!dates.has(dateStr)) {
      console.log(`Loading date ${dateStr}`)
      await updateDayHotelMetrics(dayjs(dateStr).endOf("day").format("YYYY-MM-DDTHH:mm:ss"))
    }
    const yearAgoDateStr = currDate.subtract(1, "year").format("YYYY-MM-DD")
    if (!dates.has(yearAgoDateStr)) {
      console.log(`Loading date ${dateStr}`)
      await updateDayHotelMetrics(dayjs(yearAgoDateStr).endOf("day").format("YYYY-MM-DDTHH:mm:ss"))
    }
    currDate = currDate.subtract(1, "days")
    daysLoaded++
  }
}