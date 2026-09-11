import mongoose from 'mongoose';

// Links external/source-system identifiers to a unified Profile (identity resolution).
const identityLinkSchema = new mongoose.Schema(
  {
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    sourceSystem: { type: String, required: true }, // e.g. 'SIS', 'CRM', 'Helpdesk'
    externalId: { type: String, required: true },
    confidence: { type: Number, default: 1 },
  },
  { timestamps: true }
);

identityLinkSchema.index({ sourceSystem: 1, externalId: 1 }, { unique: true });

export default mongoose.model('IdentityLink', identityLinkSchema);
