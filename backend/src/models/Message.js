import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    channel: { type: String, enum: ['email', 'sms', 'push', 'call', 'in_app'], required: true },
    direction: { type: String, enum: ['outbound', 'inbound'], required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiDrafted: { type: Boolean, default: false },
    aiRecommendationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation' },
    body: { type: String, required: true },
    status: { type: String, enum: ['draft', 'sent', 'delivered', 'failed', 'opted_out'], default: 'sent' },
    idempotencyKey: { type: String, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
