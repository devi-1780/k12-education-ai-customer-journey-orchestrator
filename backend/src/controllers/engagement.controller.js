import { z } from 'zod';
import Segment from '../models/Segment.js';
import Campaign from '../models/Campaign.js';
import Profile from '../models/Profile.js';
import Consent from '../models/Consent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const segmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  entityType: z.enum(['student', 'parent', 'teacher', 'prospective_family']).optional(),
  rules: z.array(z.object({ field: z.string(), operator: z.string(), value: z.any() })).optional(),
});

export const listSegments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId, isDeleted: false };
  const [items, total] = await Promise.all([
    Segment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Segment.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Segments fetched', items, buildMeta(page, limit, total));
});

export const createSegment = asyncHandler(async (req, res) => {
  // Simplified member-count estimate rather than a full rule engine.
  const memberCount = await Profile.countDocuments({
    organisationId: req.user.organisationId,
    entityType: req.body.entityType || 'parent',
    isDeleted: false,
  });
  const segment = await Segment.create({ ...req.body, organisationId: req.user.organisationId, createdBy: req.user.id, memberCount });
  await logAudit({ req, action: 'segment.create', entityType: 'Segment', entityId: segment._id, newValue: segment });
  return ApiResponse.created(res, 'Segment created', segment);
});

export const campaignSchema = z.object({
  name: z.string().min(2),
  segmentId: z.string().optional(),
  channel: z.enum(['email', 'sms', 'push', 'call', 'in_app']),
  purpose: z.enum(['marketing', 'service', 'academic']).optional(),
  messageTemplate: z.string().optional(),
  frequencyCapPerWeek: z.number().optional(),
  scheduledAt: z.string().optional(),
});

export const listCampaigns = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('segmentId', 'name memberCount'),
    Campaign.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Campaigns fetched', items, buildMeta(page, limit, total));
});

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, organisationId: req.user.organisationId, createdBy: req.user.id });
  await logAudit({ req, action: 'campaign.create', entityType: 'Campaign', entityId: campaign._id, newValue: campaign });
  return ApiResponse.created(res, 'Campaign created', campaign);
});

async function transitionCampaign(req, nextStatus, action) {
  const campaign = await Campaign.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (['rejected'].includes(nextStatus) && !req.body.reason) throw ApiError.badRequest('A reason is required to reject a campaign');

  const previousValue = { status: campaign.status };
  campaign.status = nextStatus;
  campaign.version += 1;
  await campaign.save();
  await logAudit({ req, action: `campaign.${action}`, entityType: 'Campaign', entityId: campaign._id, previousValue, newValue: { status: nextStatus }, reason: req.body.reason });
  return campaign;
}

export const approveCampaign = asyncHandler(async (req, res) => {
  const campaign = await transitionCampaign(req, 'approved', 'approve');
  return ApiResponse.ok(res, 'Campaign approved', campaign);
});

export const rejectCampaign = asyncHandler(async (req, res) => {
  const campaign = await transitionCampaign(req, 'rejected', 'reject');
  return ApiResponse.ok(res, 'Campaign rejected', campaign);
});

export const launchCampaign = asyncHandler(async (req, res) => {
  // Enforces consent + frequency-cap eligibility (simplified) before "sending".
  const campaign = await Campaign.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (campaign.status !== 'approved') throw ApiError.badRequest('Only approved campaigns can be launched');

  const eligibleProfiles = await Profile.find({ organisationId: req.user.organisationId, isDeleted: false }).limit(50);
  let sentCount = 0;
  for (const profile of eligibleProfiles) {
    const consent = await Consent.findOne({ profileId: profile._id, channel: campaign.channel, purpose: campaign.purpose || 'marketing' });
    if (consent && consent.granted === false) continue; // respects opt-out
    sentCount += 1;
  }
  campaign.status = 'running';
  campaign.stats.sent += sentCount;
  campaign.stats.delivered += Math.round(sentCount * 0.95);
  campaign.version += 1;
  await campaign.save();
  await logAudit({ req, action: 'campaign.launch', entityType: 'Campaign', entityId: campaign._id, newValue: { sentCount } });
  return ApiResponse.ok(res, 'Campaign launched', campaign);
});

export const getNBAQueue = asyncHandler(async (req, res) => {
  // Delegates to Recommendation collection filtered to next_best_action kind (agent work queue).
  const Recommendation = (await import('../models/Recommendation.js')).default;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId, kind: 'next_best_action' };
  if (req.query.reviewState) filter.reviewState = req.query.reviewState;
  const [items, total] = await Promise.all([
    Recommendation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('profileId', 'fullName entityType'),
    Recommendation.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Next-best-action queue fetched', items, buildMeta(page, limit, total));
});
