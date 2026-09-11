import mongoose from 'mongoose';

// Unified profile linking a tracked entity (student/parent/teacher/school leader/counsellor)
// to an optional login user (for parents who are also 'customer' users).
const profileSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    entityType: {
      type: String,
      enum: ['student', 'parent', 'teacher', 'school_leader', 'counsellor', 'staff'],
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    linkedIdentities: [
      {
        entityType: { type: String },
        profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
        relationship: { type: String }, // e.g. 'parent_of', 'teaches'
      },
    ],
    gradeOrSubject: { type: String },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    tags: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

profileSchema.index({ organisationId: 1, entityType: 1 });
profileSchema.index({ fullName: 'text', email: 'text' });

export default mongoose.model('Profile', profileSchema);
