import { BigQuery } from "@google-cloud/bigquery";

/**
 * Wrapper class for BigQuery to simplify basic queries
 */
export class BigQuerySimple {
  bigquery: BigQuery;

  constructor(projectId: string) {
    const options = {
      projectId
    };

    this.bigquery = new BigQuery(options);
  }

  /**
   * Insert rows
   * @param datasetId Target dataset id
   * @param tableId Target table id
   * @param rows Rows to insert
   */
  async insert(datasetId: string, tableId: string, rows: Array<object>): Promise<void> {
    let start = 0;
    while (start < rows.length) {
      await this.bigquery.dataset(datasetId).table(tableId).insert(rows.slice(start, start + 10000))
      start += 10000
    }
  }

  /**
   * Insert row
   * @param datasetId Target dataset id
   * @param tableId Target table id
   * @param rows Row to insert
   */
  async insertOne(datasetId: string, tableId: string, row: Object): Promise<void> {
    return this.insert(datasetId, tableId, [row])
  }

  /**
   * Select multiple rows
   * @param datasetId Source dataset id
   * @param query SQL query string
   */
  async query<T>(dateSetId: string, query: string): Promise<Array<T>> {
    const rows = await this.bigquery.dataset(dateSetId).query({
      query
    })
    return rows[0] as Array<T>
  }

  /**
   * Select one row
   * @param dateSetId Source dataset id
   * @param query SQL query string
   * @returns
   */
  async queryOne<T>(dateSetId: string, query: string): Promise<any> {
    const rows = await this.bigquery.dataset(dateSetId).query({
      query
    })
    return rows[0][0] as T
  }

  /**
   * Delete row(s)
   * @param datasetId Target dataset ID
   * @param query Delete query
   */
  async delete(datasetId: string, query: string): Promise<void> {
    await this.bigquery.dataset(datasetId).query({ query })
  }
}

/**
 * Create BigQuery instance for given project
 * @param projectId Id of the project
 * @returns
 */
export function getBigQuery(projectId: string) {
  return new BigQuerySimple(projectId)
}