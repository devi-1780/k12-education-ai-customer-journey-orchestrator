import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Single centralized error handler. Every error - validation, Mongoose, JWT,
// unexpected - flows through here into the standard error envelope.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    details = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value violates a unique constraint';
    details = Object.keys(err.keyValue || {}).map((field) => ({ field, message: 'Already exists' }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  if (env.nodeEnv !== 'production' && statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
