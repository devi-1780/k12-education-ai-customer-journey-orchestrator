import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['email', 'sms', 'push', 'call', 'web'], required: true },
    isActive: { type: Boolean, default: true },
    provider: { type: String, default: 'mock' },
  },
  { timestamps: true }
);

export default mongoose.model('Channel', channelSchema);
