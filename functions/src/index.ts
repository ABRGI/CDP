import { http, Request, Response } from '@google-cloud/functions-framework';

/**
 * Cloud function which receives information about the new reservations
 */
http('NewReservationHook', (_: Request, res: Response) => {
  res.status(200).send("Hello!").end()
});