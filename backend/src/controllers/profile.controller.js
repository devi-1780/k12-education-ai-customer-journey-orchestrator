import { z } from 'zod';
import Profile from '../models/Profile.js';
import Consent from '../models/Consent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const profileSchema = z.object({
  entityType: z.enum(['student', 'parent', 'teacher', 'school_leader', 'counsellor', 'staff']),
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gradeOrSubject: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
});

function scoped(req) {
  const base = { organisationId: req.user.organisationId, isDeleted: false };
  if (req.user.role === 'customer') base._id = { $in: req.user.ownProfileIds || [] };
  return base;
}

export const listProfiles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = scoped(req);
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.riskLevel) filter.riskLevel = req.query.riskLevel;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [items, total] = await Promise.all([
    Profile.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Profile.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Profiles fetched', items, buildMeta(page, limit, total));
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ _id: req.params.id, ...scoped(req) }).populate('linkedIdentities.profileId', 'fullName entityType');
  if (!profile) throw ApiError.notFound('Profile not found');
  return ApiResponse.ok(res, 'Profile fetched', profile);
});

export const createProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.create({ ...req.body, organisationId: req.user.organisationId });
  await logAudit({ req, action: 'profile.create', entityType: 'Profile', entityId: profile._id, newValue: profile });
  return ApiResponse.created(res, 'Profile created', profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const existing = await Profile.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!existing) throw ApiError.notFound('Profile not found');
  const previous = existing.toObject();
  Object.assign(existing, req.body);
  await existing.save();
  await logAudit({ req, action: 'profile.update', entityType: 'Profile', entityId: existing._id, previousValue: previous, newValue: existing });
  return ApiResponse.ok(res, 'Profile updated', existing);
});

export const getConsents = asyncHandler(async (req, res) => {
  const consents = await Consent.find({ profileId: req.params.id, organisationId: req.user.organisationId });
  return ApiResponse.ok(res, 'Consents fetched', consents);
});

export const upsertConsentSchema = z.object({
  channel: z.enum(['email', 'sms', 'push', 'call', 'in_app']),
  purpose: z.enum(['marketing', 'service', 'academic', 'safeguarding']),
  granted: z.boolean(),
  frequencyCapPerWeek: z.number().min(0).max(50).optional(),
});

export const upsertConsent = asyncHandler(async (req, res) => {
  const { channel, purpose, granted, frequencyCapPerWeek } = req.body;
  const update = { granted, ...(frequencyCapPerWeek !== undefined ? { frequencyCapPerWeek } : {}) };
  if (!granted) update.revokedAt = new Date();
  const consent = await Consent.findOneAndUpdate(
    { profileId: req.params.id, channel, purpose },
    { $set: update, $setOnInsert: { organisationId: req.user.organisationId, profileId: req.params.id, channel, purpose } },
    { upsert: true, new: true }
  );
  await logAudit({ req, action: 'consent.update', entityType: 'Consent', entityId: consent._id, newValue: consent });
  return ApiResponse.ok(res, 'Consent updated', consent);
});
