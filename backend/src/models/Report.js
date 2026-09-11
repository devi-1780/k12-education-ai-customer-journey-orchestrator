import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['journey', 'campaign', 'service', 'conversion', 'retention'],
      required: true,
    },
    filters: { type: mongoose.Schema.Types.Mixed },
    format: { type: String, enum: ['csv', 'pdf'], default: 'csv' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
