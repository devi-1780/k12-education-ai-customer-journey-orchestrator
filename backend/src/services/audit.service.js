import AuditLog from '../models/AuditLog.js';

// Append-only audit logging, called from every state-changing controller.
export async function logAudit({
  req,
  action,
  entityType,
  entityId,
  previousValue,
  newValue,
  reason,
  outcome = 'success',
}) {
  try {
    await AuditLog.create({
      organisationId: req.user?.organisationId || 'default-org',
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      reason,
      outcome,
      ip: req.ip,
    });
  } catch (err) {
    // Never let audit logging failure break the primary request.
    // eslint-disable-next-line no-console
    console.error('[AUDIT] failed to write audit log', err.message);
  }
}
