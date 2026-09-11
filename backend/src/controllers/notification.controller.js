import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user.id };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.type) filter.type = req.query.type;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user.id, isRead: false }),
  ]);
  return ApiResponse.ok(res, 'Notifications fetched', items, { ...buildMeta(page, limit, total), unreadCount });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { isRead: true, readAt: new Date() });
  return ApiResponse.ok(res, 'Notification marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
  return ApiResponse.ok(res, 'All notifications marked as read');
});

export const clearNotifications = asyncHandler(async (req, res) => {
  const ids = req.body.ids || [];
  await Notification.deleteMany({ _id: { $in: ids }, userId: req.user.id });
  return ApiResponse.ok(res, 'Notifications cleared');
});
