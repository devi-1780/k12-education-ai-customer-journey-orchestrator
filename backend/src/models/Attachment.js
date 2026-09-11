import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    ownerType: { type: String, enum: ['ticket', 'profile', 'report'], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    storageUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    checksum: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Attachment', attachmentSchema);
