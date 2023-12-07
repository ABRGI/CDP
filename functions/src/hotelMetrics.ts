import dayjs from "dayjs";
import { BigQuerySimple } from "./bigquery"
import { datasetId, googleProjectId } from "./env"

type HotelMetric = { [customerType: string]: { revenue: number, allocation: number } }

type HotelMetrics = { [date: string]: { [label: string]: HotelMetric } }

export const updateHotelMetrics = async (): Promise<void> => {
  const bq = new BigQuerySimple(googleProjectId)

  const created = dayjs().format("YYYY-MM-DD")
  const allocations = await bq.query<any>(datasetId, `SELECT * FROM allocations WHERE created <= '${created}'`)

  const metrics: HotelMetrics = {}
  for (const alloc of allocations) {
    let startDate = dayjs(alloc.checkIn)
    while (startDate.isBefore(dayjs(alloc.checkOut).startOf("day"))) {
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
      startDate = startDate.add(1, "days")
    }
  }

  const rows = []
  for (const date of Object.keys(metrics)) {
    for (const label of Object.keys(metrics[date])) {
      for (const customerType of Object.keys(metrics[date][label])) {
        const metric = metrics[date][label][customerType]
        rows.push({ created, date, label, customerType, revenue: metric.revenue, allocation: metric.allocation })
      }
    }
  }

  // console.log(rows.slice(0, 10))
  await bq.insert(datasetId, 'hotel_metrics', rows)
}