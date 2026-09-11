import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    name: { type: String, required: true },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
    channel: { type: String, enum: ['email', 'sms', 'push', 'call', 'in_app'], required: true },
    purpose: { type: String, enum: ['marketing', 'service', 'academic'], default: 'marketing' },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'scheduled', 'running', 'completed', 'paused', 'rejected'],
      default: 'draft',
    },
    messageTemplate: { type: String },
    frequencyCapPerWeek: { type: Number, default: 3 },
    scheduledAt: { type: Date },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      responded: { type: Number, default: 0 },
      optedOut: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Campaign', campaignSchema);
