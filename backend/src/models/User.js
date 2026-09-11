import mongoose from 'mongoose';

const ROLES = ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'customer' },
    organisationId: { type: String, default: 'default-org', index: true },
    isActive: { type: Boolean, default: true },
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    refreshTokenVersion: { type: Number, default: 0 },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ organisationId: 1, role: 1 });

export const ROLE_LIST = ROLES;
export default mongoose.model('User', userSchema);
