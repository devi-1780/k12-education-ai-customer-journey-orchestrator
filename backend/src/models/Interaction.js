import mongoose from 'mongoose';

const JOURNEY_STAGES = [
  'admission',
  'timetable_planning',
  'teaching',
  'assessment',
  'attendance',
  'parent_communication',
  'support_intervention',
  'reporting',
];

const interactionSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    stage: { type: String, enum: JOURNEY_STAGES, required: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'call', 'in_app', 'system'], default: 'system' },
    summary: { type: String, required: true },
    detail: { type: String },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'completed' },
    occurredAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

interactionSchema.index({ profileId: 1, stage: 1, occurredAt: -1 });

export const JOURNEY_STAGE_LIST = JOURNEY_STAGES;
export default mongoose.model('Interaction', interactionSchema);
