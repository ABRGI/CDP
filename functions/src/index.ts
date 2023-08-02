import { http, Request, Response } from '@google-cloud/functions-framework';
import { JSONSchema7, validate } from 'json-schema'
import { PubSub } from '@google-cloud/pubsub'
import { googleProjectId, reservationTopicId } from './env';

const pubsub = new PubSub({ projectId: googleProjectId })

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
      await pubsub.topic(reservationTopicId).publishMessage({ json: reservations })
      res.status(200).end()
    }
  }
});