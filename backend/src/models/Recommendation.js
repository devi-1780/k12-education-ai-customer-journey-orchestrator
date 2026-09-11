import mongoose from 'mongoose';

// Unified AI output model: intent/sentiment classification, churn/propensity, NBA,
// response drafting, and conversation summarisation all persist here (differentiated by `kind`).
const recommendationSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    kind: {
      type: String,
      enum: [
        'intent_sentiment',
        'churn_propensity',
        'next_best_action',
        'response_draft',
        'conversation_summary',
      ],
      required: true,
    },
    inputSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    explanation: { type: String },
    confidence: { type: Number, min: 0, max: 1, required: true },
    modelVersion: { type: String, required: true },
    isMock: { type: Boolean, default: false },
    reviewState: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected', 'overridden'],
      default: 'pending_review',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewReason: { type: String },
    overrideValue: { type: mongoose.Schema.Types.Mixed },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recommendationSchema.index({ kind: 1, reviewState: 1, createdAt: -1 });

export default mongoose.model('Recommendation', recommendationSchema);
