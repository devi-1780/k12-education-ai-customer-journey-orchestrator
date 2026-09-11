import { ApiError } from '../utils/ApiError.js';

// Wraps a Zod schema; validates req.body and surfaces field-level 400 errors.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req.body = result.data;
  next();
};
