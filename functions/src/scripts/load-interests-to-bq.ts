import dayjs from "dayjs";
import { BigQuerySimple } from "../bigquery";
import { loadCsv } from "../utils";

export const mapInterestValue = (props: { header: string, value: string }): boolean | string | number | undefined | string[] => {
  if (["happenings", "places", "interests", "values", "hotelServices"].indexOf(props.header) !== -1) {
    return props.value.split(",").map(v => {
      const matches = /[A-ZÅÄÖa-zåäö0-9\,\-\_\;\.\:\(\\) \/]+$/g.exec(v)
      if (v === '') return ''
      if (v.indexOf('🤾') !== -1) {
        return 'urheilutapahtumat'
      }
      if (!matches || matches.length !== 1) throw Error(`Error in parsing interest: ${v}`)
      return matches[0].toLocaleLowerCase()
    }).map(v => v.trim()).filter(v => v && v.length > 0)
  }
  if (["date", "time"].indexOf(props.header) !== -1) {
    return
  }
  return props.value
}

async function importInterests(projectId: string, filename: string): Promise<void> {
  console.log(`Loading CSV ${filename}...`)

  const rows = await loadCsv<any>(filename, mapInterestValue, undefined, ";")
  const interestRows = rows.filter(r => r.email && r.email.indexOf("@") !== -1).map((r) => ({
    email: r.email,
    createdAt: dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    happenings: r.happenings,
    places: r.places,
    values: r.values,
    hotelServices: r.hotelServices,
    firstName: r.firstName,
    browser: r.browser
  }))

  console.log(`Importing to BigQuery...`)
  const bq = new BigQuerySimple(projectId)
  await bq.insert("omena_customers", "customerInterests", interestRows)

  console.log('Done.')
}


importInterests(process.argv[2], process.argv[3]).then(() => console.log("OK")).catch((error: any) => console.log(`Error occurred ${JSON.stringify(error, null, 2)}`))