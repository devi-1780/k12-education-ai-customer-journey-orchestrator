// Generic Zod-based request validator middleware.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    return next(result.error);
  }
  if (result.data.body) req.body = result.data.body;
  next();
};
