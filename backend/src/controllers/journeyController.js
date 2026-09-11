import Interaction, { JOURNEY_STAGE_LIST } from '../models/Interaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { paginationParams, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/auditService.js';
import { ApiError } from '../utils/ApiError.js';

export const listInteractions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginationParams(req.query);
  const filter = {};
  if (req.scopedProfileId) filter.profile = req.scopedProfileId;
  if (req.query.profile) filter.profile = req.query.profile;
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.from || req.query.to) {
    filter.occurredAt = {};
    if (req.query.from) filter.occurredAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.occurredAt.$lte = new Date(req.query.to);
  }

  const [items, total] = await Promise.all([
    Interaction.find(filter).populate('profile', 'firstName lastName personType').sort({ occurredAt: -1 }).skip(skip).limit(limit),
    Interaction.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    message: 'Journey interactions retrieved',
    data: items,
    meta: { ...buildMeta({ page, limit, total }), stages: JOURNEY_STAGE_LIST },
  });
});

export const createInteraction = asyncHandler(async (req, res) => {
  if (req.scopedProfileId && req.body.profile !== req.scopedProfileId) {
    throw ApiError.forbidden('You may only log interactions for your own profile');
  }
  const interaction = await Interaction.create({ ...req.body, createdBy: req.user._id });
  await logAudit({ actor: req.user, action: 'interaction.create', entityType: 'Interaction', entityId: interaction._id, newValue: req.body });
  return ApiResponse.success(res, { statusCode: 201, message: 'Interaction logged', data: interaction });
});

export const journeyStages = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { message: 'Journey stages', data: JOURNEY_STAGE_LIST });
});
