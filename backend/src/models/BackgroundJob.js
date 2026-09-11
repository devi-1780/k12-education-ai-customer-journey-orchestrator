import mongoose from 'mongoose';

const backgroundJobSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // 'report_generation', 'scoring_batch', 'campaign_dispatch'
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('BackgroundJob', backgroundJobSchema);
