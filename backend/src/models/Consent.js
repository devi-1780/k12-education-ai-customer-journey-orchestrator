import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'call', 'in_app'], required: true },
    purpose: { type: String, enum: ['marketing', 'service', 'academic', 'safeguarding'], required: true },
    granted: { type: Boolean, default: true },
    frequencyCapPerWeek: { type: Number, default: 3 },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

consentSchema.index({ profileId: 1, channel: 1, purpose: 1 }, { unique: true });

export default mongoose.model('Consent', consentSchema);
