import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

// Read-only by design: no update/delete route exists for audit logs anywhere in the API.
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organisationId: req.user.organisationId };
  if (req.query.actorId) filter.actorId = req.query.actorId;
  if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.outcome) filter.outcome = req.query.outcome;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actorId', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Audit logs fetched', items, buildMeta(page, limit, total));
});
