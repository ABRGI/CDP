import { http, Request, Response } from '@google-cloud/functions-framework';
import { JSONSchema7, validate } from 'json-schema'
import { datasetId, googleProjectId } from './env';
import { BigQuerySimple } from './bigquery';
import dayjs from 'dayjs';
import { fetchWaitingReservations } from './fetchWaitingReservations';
import { timestampFormat } from './utils';
import { OnlineMerger } from './onlineMerge';

const bq = new BigQuerySimple(googleProjectId)
const onlineMerger = new OnlineMerger(googleProjectId, datasetId, false)

const NewReservationsSchema: JSONSchema7 = {
  type: "array",
  required: ["id", "guestIds"],
  properties: {
    id: {
      type: "number",
      minimum: 1
    },
    guestIds: {
      type: "array",
      items: {
        type: "number",
        minimum: 1
      }
    }
  },
};

type NewReservation = {
  id: number
  guestIds: number[]
}


/**
 * Cloud function which receives information about the new reservations
 */
http('NewReservationHook', async (req: Request, res: Response) => {
  if (!req.rawBody) {
    res.status(400).send({ message: "Missing body" }).end()
  } else {
    const reservations = JSON.parse(req.rawBody!.toString()) as NewReservation[]
    const validationResult = validate(reservations, NewReservationsSchema)
    if (validationResult.valid === false) {
      res.status(400).send({ message: "Invalid body", errors: validationResult.errors })
    } else {
      const updated = dayjs().format(timestampFormat)
      await bq.insert(datasetId, "waitingReservations", reservations.map(r => ({ ...r, updated })))
      res.status(200).end()
    }
  }
});


/**
 * Cloud function which checks for waiting reservations and handles them
 */
http('FetchReservations', async (_: Request, res: Response) => {
  try {
    await fetchWaitingReservations()
    res.status(200).end()
  } catch (error) {
    console.log(JSON.stringify(error))
    res.status(500).end()
  }
});


/**
 * Cloud function which merge new reservations to customer profiles
 */
http('MergeNewReservations', async (_: Request, res: Response) => {
  try {
    await onlineMerger.mergeNewReservations()
    res.status(200).end()
  } catch (error) {
    console.log(JSON.stringify(error))
    res.status(500).end()
  }
});