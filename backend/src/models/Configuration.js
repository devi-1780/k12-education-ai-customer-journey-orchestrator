import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    category: {
      type: String,
      enum: ['ai_settings', 'workflow_rules', 'thresholds', 'integrations', 'notification_rules', 'master_data'],
      default: 'master_data',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

configurationSchema.index({ organisationId: 1, key: 1 }, { unique: true });

export default mongoose.model('Configuration', configurationSchema);
