import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, org: user.organisation }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.refreshTokenVersion },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing access token');

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findOne({ _id: payload.sub, isDeleted: false });
  if (!user || user.status !== 'active') {
    throw ApiError.unauthorized('User no longer active');
  }

  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};
