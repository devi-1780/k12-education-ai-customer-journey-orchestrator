import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User, { ROLE_LIST } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLE_LIST),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(ROLE_LIST).optional(),
  isActive: z.boolean().optional(),
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId, isDeleted: false };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.$or = [{ name: new RegExp(req.query.search, 'i') }, { email: new RegExp(req.query.search, 'i') }];

  const [items, total] = await Promise.all([
    User.find(filter).select('-passwordHash -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Users fetched', items, buildMeta(page, limit, total));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role, organisationId: req.user.organisationId });
  await logAudit({ req, action: 'user.create', entityType: 'User', entityId: user._id, newValue: { name, email, role } });
  return ApiResponse.created(res, 'User created', { id: user._id, name, email, role });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!user) throw ApiError.notFound('User not found');
  const previous = { name: user.name, role: user.role, isActive: user.isActive };
  Object.assign(user, req.body);
  await user.save();
  await logAudit({ req, action: 'user.update', entityType: 'User', entityId: user._id, previousValue: previous, newValue: req.body });
  return ApiResponse.ok(res, 'User updated', { id: user._id, name: user.name, role: user.role, isActive: user.isActive });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organisationId: req.user.organisationId });
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = false;
  await user.save();
  await logAudit({ req, action: 'user.deactivate', entityType: 'User', entityId: user._id });
  return ApiResponse.ok(res, 'User deactivated', { id: user._id });
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, organisationId: req.user.organisationId });
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = true;
  await user.save();
  await logAudit({ req, action: 'user.activate', entityType: 'User', entityId: user._id });
  return ApiResponse.ok(res, 'User activated', { id: user._id });
});
