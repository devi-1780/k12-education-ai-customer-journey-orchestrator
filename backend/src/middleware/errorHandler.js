import { env } from '../config/env.js';

// Single centralized error-handling middleware. Every error flows through here.
export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details;

  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value violates a uniqueness constraint';
    details = err.keyValue;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.isApiError) {
    details = err.details;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[UNHANDLED ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
