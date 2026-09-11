import { asyncHandler } from '../utils/asyncHandler.js';
import Profile from '../models/Profile.js';

// Attaches the customer's own linked profile IDs so self-scoped data access
// can be enforced server-side (never trusted from the frontend).
export const attachOwnScope = asyncHandler(async (req, res, next) => {
  if (req.user?.role === 'customer') {
    const profiles = await Profile.find({ linkedUserId: req.user.id, isDeleted: false }).select('_id');
    req.user.ownProfileIds = profiles.map((p) => p._id);
  }
  next();
});
