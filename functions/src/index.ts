import { http, Request, Response } from '@google-cloud/functions-framework';

http('NewReservationHook', (_: Request, res: Response) => {
  res.status(200).send("Hello!").end()
});