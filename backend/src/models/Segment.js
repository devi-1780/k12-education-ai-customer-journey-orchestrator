import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    name: { type: String, required: true },
    description: { type: String },
    entityType: { type: String, enum: ['student', 'parent', 'teacher', 'prospective_family'], default: 'parent' },
    rules: [
      {
        field: String,
        operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'gt', 'lt', 'in'] },
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    memberCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Segment', segmentSchema);
