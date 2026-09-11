import { z } from 'zod';
import Recommendation from '../models/Recommendation.js';
import Profile from '../models/Profile.js';
import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';
import {
  classifyIntentSentiment,
  scoreChurnPropensity,
  recommendNextBestAction,
  draftResponse,
  summarizeConversation,
} from '../services/gemini.service.js';

const MODEL_VERSION = 'gemini-orchestrator-v1';

export const listRecommendations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId };
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.reviewState) filter.reviewState = req.query.reviewState;
  if (req.query.profileId) filter.profileId = req.query.profileId;

  const [items, total] = await Promise.all([
    Recommendation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('profileId', 'fullName entityType'),
    Recommendation.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Recommendations fetched', items, buildMeta(page, limit, total));
});

export const intentSentimentSchema = z.object({ profileId: z.string().optional(), text: z.string().min(2) });

export const runIntentSentiment = asyncHandler(async (req, res) => {
  const { profileId, text } = req.body;
  const result = await classifyIntentSentiment(text);
  const rec = await Recommendation.create({
    organisationId: req.user.organisationId,
    profileId,
    kind: 'intent_sentiment',
    inputSnapshot: { text },
    output: { intent: result.intent, sentiment: result.sentiment },
    explanation: `Classified from message text using ${MODEL_VERSION}.`,
    confidence: result.confidence ?? 0.6,
    modelVersion: MODEL_VERSION,
    isMock: result.isMock,
  });
  await logAudit({ req, action: 'ai.intent_sentiment', entityType: 'Recommendation', entityId: rec._id, newValue: rec });
  return ApiResponse.created(res, 'Intent/sentiment classified', rec);
});

export const churnSchema = z.object({ profileId: z.string() });

export const runChurnPropensity = asyncHandler(async (req, res) => {
  const { profileId } = req.body;
  const profile = await Profile.findById(profileId);
  if (!profile) throw ApiError.notFound('Profile not found');
  const summary = { entityType: profile.entityType, riskLevel: profile.riskLevel, tags: profile.tags };
  const result = await scoreChurnPropensity(summary);
  const rec = await Recommendation.create({
    organisationId: req.user.organisationId,
    profileId,
    kind: 'churn_propensity',
    inputSnapshot: summary,
    output: { churnScore: result.churnScore, factors: result.factors },
    explanation: `Estimated from engagement history using ${MODEL_VERSION}.`,
    confidence: 1 - Math.abs(0.5 - (result.churnScore ?? 0.5)) * 0.4 + 0.5,
    modelVersion: MODEL_VERSION,
    isMock: result.isMock,
  });
  await logAudit({ req, action: 'ai.churn_propensity', entityType: 'Recommendation', entityId: rec._id, newValue: rec });
  return ApiResponse.created(res, 'Churn/propensity scored', rec);
});

export const nbaSchema = z.object({ profileId: z.string(), stage: z.string().optional() });

export const runNextBestAction = asyncHandler(async (req, res) => {
  const { profileId, stage } = req.body;
  const profile = await Profile.findById(profileId);
  if (!profile) throw ApiError.notFound('Profile not found');
  const context = { entityType: profile.entityType, stage, riskLevel: profile.riskLevel };
  const result = await recommendNextBestAction(context);
  const rec = await Recommendation.create({
    organisationId: req.user.organisationId,
    profileId,
    kind: 'next_best_action',
    inputSnapshot: context,
    output: { action: result.action, channel: result.channel, rationale: result.rationale },
    explanation: result.rationale || 'Recommended based on journey stage and risk profile.',
    confidence: result.confidence ?? 0.55,
    modelVersion: MODEL_VERSION,
    isMock: result.isMock,
  });
  await logAudit({ req, action: 'ai.next_best_action', entityType: 'Recommendation', entityId: rec._id, newValue: rec });
  return ApiResponse.created(res, 'Next-best-action generated', rec);
});

export const draftSchema = z.object({ ticketId: z.string() });

export const runDraftResponse = asyncHandler(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await Ticket.findById(ticketId).populate('profileId', 'fullName entityType');
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const context = { subject: ticket.subject, category: ticket.category, profile: ticket.profileId?.fullName };
  const result = await draftResponse(context);
  const rec = await Recommendation.create({
    organisationId: req.user.organisationId,
    profileId: ticket.profileId?._id,
    ticketId: ticket._id,
    kind: 'response_draft',
    inputSnapshot: context,
    output: { draft: result.draft },
    explanation: `Drafted reply for agent review using ${MODEL_VERSION}.`,
    confidence: 0.7,
    modelVersion: MODEL_VERSION,
    isMock: result.isMock,
  });
  await logAudit({ req, action: 'ai.draft_response', entityType: 'Recommendation', entityId: rec._id, newValue: rec });
  return ApiResponse.created(res, 'Response drafted', rec);
});

export const summarySchema = z.object({ ticketId: z.string() });

export const runSummarizeConversation = asyncHandler(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const messages = await Message.find({ ticketId }).sort({ createdAt: 1 }).select('direction body channel');
  const result = await summarizeConversation(messages);
  const rec = await Recommendation.create({
    organisationId: req.user.organisationId,
    profileId: ticket.profileId,
    ticketId: ticket._id,
    kind: 'conversation_summary',
    inputSnapshot: { messageCount: messages.length },
    output: { summary: result.summary },
    explanation: `Summarised ${messages.length} messages using ${MODEL_VERSION}.`,
    confidence: 0.75,
    modelVersion: MODEL_VERSION,
    isMock: result.isMock,
  });
  await logAudit({ req, action: 'ai.summarize_conversation', entityType: 'Recommendation', entityId: rec._id, newValue: rec });
  return ApiResponse.created(res, 'Conversation summarised', rec);
});

export const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'overridden']),
  reason: z.string().optional(),
  overrideValue: z.any().optional(),
});

export const reviewRecommendation = asyncHandler(async (req, res) => {
  const rec = await Recommendation.findOne({ _id: req.params.id, organisationId: req.user.organisationId });
  if (!rec) throw ApiError.notFound('Recommendation not found');
  const { decision, reason, overrideValue } = req.body;
  if (['rejected', 'overridden'].includes(decision) && !reason) {
    throw ApiError.badRequest('A reason is mandatory when rejecting or overriding an AI recommendation');
  }
  const previousValue = { reviewState: rec.reviewState };
  rec.reviewState = decision;
  rec.reviewedBy = req.user.id;
  rec.reviewedAt = new Date();
  rec.reviewReason = reason;
  if (decision === 'overridden') rec.overrideValue = overrideValue;
  rec.version += 1;
  await rec.save();
  await logAudit({ req, action: `ai.recommendation.${decision}`, entityType: 'Recommendation', entityId: rec._id, previousValue, newValue: rec, reason });
  return ApiResponse.ok(res, 'Recommendation review recorded', rec);
});
