import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['assignment', 'exception', 'approval', 'alert', 'due_date', 'ai_result', 'system'],
      default: 'system',
    },
    severity: { type: String, enum: ['info', 'warning', 'urgent'], default: 'info' },
    title: { type: String, required: true },
    body: { type: String },
    relatedEntityType: { type: String },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
