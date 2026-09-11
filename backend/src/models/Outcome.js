import mongoose from 'mongoose';

const outcomeSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    recommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    type: {
      type: String,
      enum: ['acceptance', 'response', 'conversion', 'retention', 'false_positive'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed },
    measuredAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Outcome', outcomeSchema);
