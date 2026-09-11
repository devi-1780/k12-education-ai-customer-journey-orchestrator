import Profile from '../models/Profile.js';
import Interaction from '../models/Interaction.js';
import Ticket from '../models/Ticket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { paginationParams, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/auditService.js';

export const listProfiles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = { isDeleted: false };
  if (req.scopedProfileId) filter._id = req.scopedProfileId;
  if (req.query.personType) filter.personType = req.query.personType;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
  if (req.query.q) {
    const re = new RegExp(req.query.q, 'i');
    filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
  }

  const [items, total] = await Promise.all([
    Profile.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Profile.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    message: 'Profiles retrieved',
    data: items,
    meta: buildMeta({ page, limit, total }),
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  if (req.scopedProfileId && req.scopedProfileId !== req.params.id) {
    throw ApiError.forbidden('You may only view your own profile');
  }
  const profile = await Profile.findOne({ _id: req.params.id, isDeleted: false })
    .populate('guardians', 'firstName lastName personType')
    .populate('children', 'firstName lastName personType grade');
  if (!profile) throw ApiError.notFound('Profile not found');

  const [openTicketCount, recentInteractions] = await Promise.all([
    Ticket.countDocuments({ profile: profile._id, status: { $in: ['open', 'in_progress', 'escalated'] }, isDeleted: false }),
    Interaction.find({ profile: profile._id }).sort({ occurredAt: -1 }).limit(10),
  ]);

  return ApiResponse.success(res, {
    message: 'Profile retrieved',
    data: { profile, openTicketCount, recentInteractions },
  });
});

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.create({ ...req.body });
  await logAudit({ actor: req.user, action: 'profile.create', entityType: 'Profile', entityId: profile._id, newValue: req.body });
  return ApiResponse.success(res, { statusCode: 201, message: 'Profile created', data: profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ _id: req.params.id, isDeleted: false });
  if (!profile) throw ApiError.notFound('Profile not found');
  if (req.scopedProfileId && req.scopedProfileId !== req.params.id) {
    throw ApiError.forbidden('You may only edit your own profile');
  }
  const previousValue = profile.toObject();
  Object.assign(profile, req.body);
  await profile.save();
  await logAudit({ actor: req.user, action: 'profile.update', entityType: 'Profile', entityId: profile._id, previousValue, newValue: req.body });
  return ApiResponse.success(res, { message: 'Profile updated', data: profile });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ _id: req.params.id, isDeleted: false });
  if (!profile) throw ApiError.notFound('Profile not found');
  profile.isDeleted = true;
  profile.deletedAt = new Date();
  await profile.save();
  await logAudit({ actor: req.user, action: 'profile.delete', entityType: 'Profile', entityId: profile._id });
  return ApiResponse.success(res, { message: 'Profile deleted (soft)' });
});
