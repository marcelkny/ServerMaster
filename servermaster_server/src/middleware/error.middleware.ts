import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.ts';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  // Unterscheidung zwischen bekannten AppErrors und unerwarteten Fehlern
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Interner Serverfehler';

  // Logging für unerwartete Systemfehler im Entwicklungsmodus
  if (!(err instanceof AppError)) {
    console.error('UNEXPECTED ERROR 💥:', err);
  }

  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};