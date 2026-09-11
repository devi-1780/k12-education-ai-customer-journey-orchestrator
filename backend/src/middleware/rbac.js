import { ApiError } from '../utils/ApiError.js';

// Enforces that a 'customer' role can only ever access records tied to their own profile.
export function scopeToOwnProfileIfCustomer(req, res, next) {
  if (req.user.role === 'customer') {
    if (!req.user.linkedProfile) {
      throw ApiError.forbidden('No linked profile for this account');
    }
    req.scopedProfileId = req.user.linkedProfile.toString();
  }
  next();
}
