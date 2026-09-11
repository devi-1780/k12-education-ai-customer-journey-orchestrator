import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing access token');

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findOne({ _id: payload.sub, isDeleted: false, isActive: true });
  if (!user) throw ApiError.unauthorized('User no longer active');

  req.user = {
    id: user._id.toString(),
    role: user.role,
    organisationId: user.organisationId,
    name: user.name,
    email: user.email,
  };
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`));
  }
  next();
};

// Enforces that 'customer' role users may only access records scoped to their own profile.
// Controllers call this helper to build the base filter for any query.
export function scopeFilter(req, profileFieldName = 'profileId') {
  const base = { organisationId: req.user.organisationId };
  if (req.user.role === 'customer' && req.user.ownProfileIds) {
    base[profileFieldName] = { $in: req.user.ownProfileIds };
  }
  return base;
}
