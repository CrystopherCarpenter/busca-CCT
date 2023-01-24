import { NextFunction, Request, Response } from 'express';

export const handleApplicationErrors = (err: number, _req: Request, res: Response, _next: NextFunction) => {
  return res.sendStatus(err);
};
