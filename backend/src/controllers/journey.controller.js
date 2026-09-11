import { z } from 'zod';
import Interaction, { JOURNEY_STAGE_LIST } from '../models/Interaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const interactionSchema = z.object({
  profileId: z.string(),
  stage: z.enum(JOURNEY_STAGE_LIST),
  channel: z.enum(['email', 'sms', 'push', 'call', 'in_app', 'system']).optional(),
  summary: z.string().min(2),
  detail: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const listInteractions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId };
  if (req.user.role === 'customer') filter.profileId = { $in: req.user.ownProfileIds || [] };
  if (req.query.profileId) filter.profileId = req.query.profileId;
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.occurredAt = {};
    if (req.query.from) filter.occurredAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.occurredAt.$lte = new Date(req.query.to);
  }

  const [items, total] = await Promise.all([
    Interaction.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).populate('profileId', 'fullName entityType'),
    Interaction.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Journey timeline fetched', items, buildMeta(page, limit, total));
});

export const createInteraction = asyncHandler(async (req, res) => {
  const interaction = await Interaction.create({ ...req.body, organisationId: req.user.organisationId });
  await logAudit({ req, action: 'interaction.create', entityType: 'Interaction', entityId: interaction._id, newValue: interaction });
  return ApiResponse.created(res, 'Journey event recorded', interaction);
});

export const journeyStages = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, 'Journey stages', JOURNEY_STAGE_LIST);
});
