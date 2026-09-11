import mongoose from 'mongoose';

// Append-only. No update/delete routes are ever exposed for this collection.
const auditLogSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
