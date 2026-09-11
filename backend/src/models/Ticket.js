import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    organisationId: { type: String, default: 'default-org', index: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'admission',
        'timetable_planning',
        'teaching',
        'assessment',
        'attendance',
        'parent_communication',
        'support_intervention',
        'reporting',
      ],
      default: 'support_intervention',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: {
      type: String,
      enum: ['open', 'pending_review', 'in_progress', 'deferred', 'escalated', 'closed'],
      default: 'open',
    },
    churnPropensity: { type: Number, min: 0, max: 1 },
    history: [
      {
        action: {
          type: String,
          enum: ['created', 'assigned', 'edited', 'approved', 'rejected', 'deferred', 'overridden', 'escalated', 'closed'],
        },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        reason: String,
        at: { type: Date, default: Date.now },
      },
    ],
    version: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ticketSchema.index({ organisationId: 1, status: 1, priority: 1 });

export default mongoose.model('Ticket', ticketSchema);
