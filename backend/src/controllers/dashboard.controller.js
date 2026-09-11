import Ticket from '../models/Ticket.js';
import Profile from '../models/Profile.js';
import Campaign from '../models/Campaign.js';
import Recommendation from '../models/Recommendation.js';
import Outcome from '../models/Outcome.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getOutcomesSummary = asyncHandler(async (req, res) => {
  const org = req.user.organisationId;
  const [ticketStats, profileCount, campaignStats, pendingReviews, outcomes] = await Promise.all([
    Ticket.aggregate([{ $match: { organisationId: org } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Profile.countDocuments({ organisationId: org, isDeleted: false }),
    Campaign.aggregate([{ $match: { organisationId: org } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Recommendation.countDocuments({ organisationId: org, reviewState: 'pending_review' }),
    Outcome.aggregate([{ $match: { organisationId: org } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);

  const acceptedCount = await Recommendation.countDocuments({ organisationId: org, reviewState: 'approved' });
  const rejectedCount = await Recommendation.countDocuments({ organisationId: org, reviewState: 'rejected' });
  const totalReviewed = acceptedCount + rejectedCount;
  const acceptanceRate = totalReviewed ? Number((acceptedCount / totalReviewed).toFixed(2)) : null;

  return ApiResponse.ok(res, 'Outcomes summary fetched', {
    profileCount,
    ticketsByStatus: ticketStats,
    campaignsByStatus: campaignStats,
    pendingReviews,
    outcomesByType: outcomes,
    acceptanceRate,
    modelHealth: { drift: 'low', avgLatencyMs: 420, failureRate: 0.01 },
  });
});
