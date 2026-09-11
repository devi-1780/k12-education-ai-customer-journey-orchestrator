import mongoose from 'mongoose';

// Generic approval/override record usable by tickets, campaigns, and recommendations.
const approvalSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['Ticket', 'Campaign', 'Recommendation', 'Message'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    decision: { type: String, enum: ['approved', 'rejected', 'overridden'], required: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Approval', approvalSchema);
