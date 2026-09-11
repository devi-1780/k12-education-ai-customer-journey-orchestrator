import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User, { ROLE_LIST } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { logAudit } from '../services/auditService.js';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(ROLE_LIST).default('customer'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  await logAudit({ actor: user, action: 'user.register', entityType: 'User', entityId: user._id, newValue: { email, role } });

  return ApiResponse.success(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user: sanitizeUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isDeleted: false });

  if (!user || !(await user.comparePassword(password))) {
    await logAudit({ actor: null, action: 'auth.login', entityType: 'User', outcome: 'failure', newValue: { email } });
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.status !== 'active') {
    throw ApiError.forbidden('This account is not active. Contact an administrator.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await logAudit({ actor: user, action: 'auth.login', entityType: 'User', entityId: user._id });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    message: 'Login successful',
    data: { user: sanitizeUser(user), accessToken, refreshToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findOne({ _id: payload.sub, isDeleted: false });
  if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    message: 'Token refreshed',
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.refreshTokenVersion += 1; // invalidate all outstanding refresh tokens
    await req.user.save();
    await logAudit({ actor: req.user, action: 'auth.logout', entityType: 'User', entityId: req.user._id });
  }
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { message: 'Current user', data: { user: sanitizeUser(req.user) } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always respond success to avoid user enumeration; log internally either way.
  if (user) {
    await logAudit({ actor: user, action: 'auth.forgot_password_requested', entityType: 'User', entityId: user._id });
  }
  return ApiResponse.success(res, {
    message: 'If an account with that email exists, password reset instructions have been sent.',
  });
});
