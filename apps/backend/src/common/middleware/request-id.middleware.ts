import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
  const existing = (req.headers['x-request-id'] as string) || undefined;
  const id = existing || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
