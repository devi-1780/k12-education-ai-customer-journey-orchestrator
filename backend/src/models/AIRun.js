import mongoose from 'mongoose';

// Background/async AI job tracking (e.g. batch scoring), separate from the
// synchronous Recommendation record it eventually produces.
const aiRunSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    jobType: {
      type: String,
      enum: ['batch_scoring', 'campaign_dispatch', 'report_generation', 'model_recalibration'],
      required: true,
    },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('AIRun', aiRunSchema);
