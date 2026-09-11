import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import User, { ROLE_LIST } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/token.service.js';
import { logAudit } from '../services/audit.service.js';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLE_LIST).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ token: z.string(), password: z.string().min(8) });

function sanitizeUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    organisationId: u.organisationId,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: role || 'customer' });

  await logAudit({ req: { ...req, user: { id: user._id, role: user.role, organisationId: user.organisationId } }, action: 'user.register', entityType: 'User', entityId: user._id, newValue: sanitizeUser(user) });

  return ApiResponse.created(res, 'Account created', { user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isDeleted: false });
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await logAudit({ req: { ...req, user: { id: user._id, role: user.role, organisationId: user.organisationId } }, action: 'user.login', entityType: 'User', entityId: user._id });

  return ApiResponse.ok(res, 'Login successful', { user: sanitizeUser(user), accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('refreshToken is required');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findOne({ _id: payload.sub, isDeleted: false, isActive: true });
  if (!user || user.refreshTokenVersion !== payload.v) throw ApiError.unauthorized('Refresh token no longer valid');

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  return ApiResponse.ok(res, 'Token refreshed', { accessToken, refreshToken: newRefreshToken });
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
  await logAudit({ req, action: 'user.logout', entityType: 'User', entityId: req.user.id });
  return ApiResponse.ok(res, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  return ApiResponse.ok(res, 'Current user', { user: sanitizeUser(user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isDeleted: false });
  // Always respond success to avoid user enumeration.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await logAudit({ req: { ...req, user: { id: user._id, role: user.role, organisationId: user.organisationId } }, action: 'user.forgot_password', entityType: 'User', entityId: user._id });
    // In production this would be emailed; for demo we log/return it isn't exposed to the client.
  }
  return ApiResponse.ok(res, 'If that email exists, password reset instructions have been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: new Date() } });
  if (!user) throw ApiError.badRequest('Reset token is invalid or expired');

  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenVersion += 1;
  await user.save();

  await logAudit({ req: { ...req, user: { id: user._id, role: user.role, organisationId: user.organisationId } }, action: 'user.reset_password', entityType: 'User', entityId: user._id });
  return ApiResponse.ok(res, 'Password reset successful');
});
