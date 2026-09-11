import AuditLog from '../models/AuditLog.js';

/**
 * Append-only audit logging service. Called from every state-changing controller.
 */
export async function logAudit({
  actor,
  action,
  entityType,
  entityId = null,
  previousValue = null,
  newValue = null,
  reason = null,
  outcome = 'success',
  organisation = 'default-org',
  ip = null,
}) {
  try {
    await AuditLog.create({
      organisation,
      actor: actor?._id || actor || null,
      actorRole: actor?.role || null,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      reason,
      outcome,
      ip,
    });
  } catch (err) {
    // Audit logging must never crash the primary request, but should be visible in server logs.
    // eslint-disable-next-line no-console
    console.error('[AUDIT LOG FAILURE]', err.message);
  }
}
