import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Consent from '../models/Consent.js';
import Interaction from '../models/Interaction.js';
import Segment from '../models/Segment.js';
import Campaign from '../models/Campaign.js';
import Recommendation from '../models/Recommendation.js';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import Outcome from '../models/Outcome.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Configuration from '../models/Configuration.js';
import Report from '../models/Report.js';

const ORG = 'default-org';
const PASSWORD = 'Password123!';

async function clearAll() {
  await Promise.all(
    [User, Profile, Consent, Interaction, Segment, Campaign, Recommendation, Message, Ticket, Outcome, Notification, AuditLog, Configuration, Report].map(
      (m) => m.deleteMany({})
    )
  );
}

async function run() {
  await connectDB();
  console.log('[SEED] Clearing existing data...');
  await clearAll();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log('[SEED] Creating users (one per role)...');
  const [admin, salesManager, marketingManager, serviceAgent, customer] = await User.create([
    { name: 'Ava Admin', email: 'admin@schoolgroup.test', passwordHash, role: 'admin', organisationId: ORG },
    { name: 'Sam Sales', email: 'sales@schoolgroup.test', passwordHash, role: 'sales_manager', organisationId: ORG },
    { name: 'Mia Marketing', email: 'marketing@schoolgroup.test', passwordHash, role: 'marketing_manager', organisationId: ORG },
    { name: 'Alex Agent', email: 'agent@schoolgroup.test', passwordHash, role: 'service_agent', organisationId: ORG },
    { name: 'Priya Parent', email: 'parent@schoolgroup.test', passwordHash, role: 'customer', organisationId: ORG },
  ]);

  console.log('[SEED] Creating profiles...');
  const parentProfile = await Profile.create({
    organisationId: ORG,
    entityType: 'parent',
    fullName: 'Priya Parent',
    email: 'parent@schoolgroup.test',
    phone: '+1-555-0101',
    linkedUserId: customer._id,
    riskLevel: 'medium',
    tags: ['prospective_sibling_admission'],
  });

  const studentProfile = await Profile.create({
    organisationId: ORG,
    entityType: 'student',
    fullName: 'Kiran Parent-Student',
    gradeOrSubject: 'Grade 6',
    riskLevel: 'low',
    tags: ['honor_roll'],
  });

  const teacherProfile = await Profile.create({
    organisationId: ORG,
    entityType: 'teacher',
    fullName: 'Mr. David Teacher',
    gradeOrSubject: 'Mathematics',
  });

  const counsellorProfile = await Profile.create({
    organisationId: ORG,
    entityType: 'counsellor',
    fullName: 'Ms. Grace Counsellor',
  });

  const otherFamilies = await Profile.create(
    Array.from({ length: 6 }).map((_, i) => ({
      organisationId: ORG,
      entityType: i % 2 === 0 ? 'parent' : 'student',
      fullName: `Family Contact ${i + 1}`,
      email: `family${i + 1}@example.test`,
      riskLevel: ['low', 'medium', 'high'][i % 3],
      tags: i % 2 === 0 ? ['newsletter_subscriber'] : ['grade_5'],
    }))
  );

  parentProfile.linkedIdentities.push({ entityType: 'student', profileId: studentProfile._id, relationship: 'parent_of' });
  await parentProfile.save();

  console.log('[SEED] Creating consents...');
  await Consent.create([
    { organisationId: ORG, profileId: parentProfile._id, channel: 'email', purpose: 'marketing', granted: true, frequencyCapPerWeek: 3 },
    { organisationId: ORG, profileId: parentProfile._id, channel: 'sms', purpose: 'service', granted: true, frequencyCapPerWeek: 5 },
    { organisationId: ORG, profileId: otherFamilies[0]._id, channel: 'email', purpose: 'marketing', granted: false },
  ]);

  console.log('[SEED] Creating journey interactions (8 stages)...');
  const stages = ['admission', 'timetable_planning', 'teaching', 'assessment', 'attendance', 'parent_communication', 'support_intervention', 'reporting'];
  const interactions = [];
  for (const profile of [parentProfile, studentProfile]) {
    for (const stage of stages) {
      interactions.push({
        organisationId: ORG,
        profileId: profile._id,
        stage,
        channel: 'system',
        summary: `${stage.replace('_', ' ')} event for ${profile.fullName}`,
        status: 'completed',
        occurredAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 60),
      });
    }
  }
  await Interaction.insertMany(interactions);

  console.log('[SEED] Creating segments & campaigns...');
  const segment = await Segment.create({
    organisationId: ORG,
    name: 'Prospective Sibling Families',
    description: 'Parents with an existing enrolled child, high admission propensity for siblings',
    entityType: 'parent',
    rules: [{ field: 'tags', operator: 'contains', value: 'prospective_sibling_admission' }],
    memberCount: 1,
    createdBy: marketingManager._id,
  });

  const campaign = await Campaign.create({
    organisationId: ORG,
    name: 'Sibling Admission Nudge - Fall Intake',
    segmentId: segment._id,
    channel: 'email',
    purpose: 'marketing',
    status: 'approved',
    messageTemplate: 'We would love to welcome your family further — sibling seats are open for Fall intake.',
    frequencyCapPerWeek: 2,
    stats: { sent: 40, delivered: 38, responded: 12, optedOut: 1, converted: 4 },
    createdBy: marketingManager._id,
  });

  console.log('[SEED] Creating tickets + messages...');
  const ticket = await Ticket.create({
    organisationId: ORG,
    profileId: parentProfile._id,
    createdByUserId: customer._id,
    assignedTo: serviceAgent._id,
    subject: 'Question about timetable clash for Grade 6 Math',
    category: 'timetable_planning',
    priority: 'medium',
    status: 'in_progress',
    churnPropensity: 0.22,
    history: [
      { action: 'created', actorId: customer._id, at: new Date() },
      { action: 'assigned', actorId: admin._id, newValue: { assignedTo: serviceAgent._id }, at: new Date() },
    ],
  });

  await Message.create([
    { organisationId: ORG, ticketId: ticket._id, profileId: parentProfile._id, channel: 'in_app', direction: 'inbound', body: 'My child has a timetable clash between Math and Art on Tuesdays.', status: 'sent' },
    { organisationId: ORG, ticketId: ticket._id, profileId: parentProfile._id, channel: 'in_app', direction: 'outbound', author: serviceAgent._id, aiDrafted: true, body: 'Thanks for flagging this — I am checking with the timetable team and will confirm a resolution by tomorrow.', status: 'sent' },
  ]);

  console.log('[SEED] Creating AI recommendations...');
  const recs = await Recommendation.create([
    {
      organisationId: ORG,
      profileId: parentProfile._id,
      kind: 'intent_sentiment',
      inputSnapshot: { text: 'My child has a timetable clash between Math and Art on Tuesdays.' },
      output: { intent: 'timetable_support_request', sentiment: 'neutral' },
      explanation: 'Classified from ticket message text.',
      confidence: 0.81,
      modelVersion: 'gemini-orchestrator-v1',
      isMock: true,
      reviewState: 'approved',
      reviewedBy: serviceAgent._id,
      reviewedAt: new Date(),
    },
    {
      organisationId: ORG,
      profileId: parentProfile._id,
      kind: 'churn_propensity',
      inputSnapshot: { entityType: 'parent', riskLevel: 'medium' },
      output: { churnScore: 0.22, factors: ['single_open_ticket', 'no_prior_escalations'] },
      explanation: 'Estimated from engagement + ticket history.',
      confidence: 0.7,
      modelVersion: 'gemini-orchestrator-v1',
      isMock: true,
      reviewState: 'pending_review',
    },
    {
      organisationId: ORG,
      profileId: parentProfile._id,
      kind: 'next_best_action',
      inputSnapshot: { stage: 'admission', riskLevel: 'medium' },
      output: { action: 'Send sibling-admission info pack', channel: 'email', rationale: 'Parent tagged as prospective sibling admission with high email engagement.' },
      explanation: 'Recommended based on journey stage and tag signals.',
      confidence: 0.64,
      modelVersion: 'gemini-orchestrator-v1',
      isMock: true,
      reviewState: 'pending_review',
    },
    {
      organisationId: ORG,
      ticketId: ticket._id,
      profileId: parentProfile._id,
      kind: 'response_draft',
      inputSnapshot: { subject: ticket.subject, category: ticket.category },
      output: { draft: 'Thanks for flagging this — I am checking with the timetable team and will confirm a resolution by tomorrow.' },
      explanation: 'Drafted reply for agent review.',
      confidence: 0.72,
      modelVersion: 'gemini-orchestrator-v1',
      isMock: true,
      reviewState: 'approved',
      reviewedBy: serviceAgent._id,
      reviewedAt: new Date(),
    },
  ]);

  console.log('[SEED] Creating outcomes...');
  await Outcome.create([
    { organisationId: ORG, recommendationId: recs[3]._id, profileId: parentProfile._id, type: 'acceptance', value: { accepted: true } },
    { organisationId: ORG, campaignId: campaign._id, profileId: otherFamilies[0]._id, type: 'conversion', value: { converted: true } },
    { organisationId: ORG, campaignId: campaign._id, profileId: otherFamilies[1]._id, type: 'response', value: { responded: true } },
    { organisationId: ORG, campaignId: campaign._id, profileId: otherFamilies[2]._id, type: 'retention', value: { retained: true } },
  ]);

  console.log('[SEED] Creating notifications...');
  await Notification.create([
    { organisationId: ORG, userId: serviceAgent._id, type: 'assignment', severity: 'info', title: 'New ticket assigned', body: ticket.subject, relatedEntityType: 'Ticket', relatedEntityId: ticket._id },
    { organisationId: ORG, userId: marketingManager._id, type: 'approval', severity: 'warning', title: 'Campaign pending approval', body: 'Review the Fall Intake campaign', relatedEntityType: 'Campaign', relatedEntityId: campaign._id },
    { organisationId: ORG, userId: admin._id, type: 'ai_result', severity: 'info', title: 'New churn-propensity score generated', relatedEntityType: 'Recommendation', relatedEntityId: recs[1]._id },
    { organisationId: ORG, userId: customer._id, type: 'system', severity: 'info', title: 'Your ticket is being reviewed', relatedEntityType: 'Ticket', relatedEntityId: ticket._id },
  ]);

  console.log('[SEED] Creating configuration...');
  await Configuration.create([
    { organisationId: ORG, key: 'ai.confidence_threshold', value: 0.6, category: 'ai_settings', updatedBy: admin._id },
    { organisationId: ORG, key: 'outreach.default_frequency_cap', value: 3, category: 'thresholds', updatedBy: admin._id },
    { organisationId: ORG, key: 'notifications.escalation_channel', value: 'email', category: 'notification_rules', updatedBy: admin._id },
  ]);

  console.log('[SEED] Writing sample audit log entries...');
  await AuditLog.create([
    { organisationId: ORG, actorId: admin._id, actorRole: 'admin', action: 'user.create', entityType: 'User', entityId: serviceAgent._id, newValue: { role: 'service_agent' } },
    { organisationId: ORG, actorId: serviceAgent._id, actorRole: 'service_agent', action: 'ticket.assigned', entityType: 'Ticket', entityId: ticket._id },
    { organisationId: ORG, actorId: marketingManager._id, actorRole: 'marketing_manager', action: 'campaign.create', entityType: 'Campaign', entityId: campaign._id },
  ]);

  console.log('\n[SEED] Done. Login credentials (all use password: %s):', PASSWORD);
  console.log('  Admin:              admin@schoolgroup.test');
  console.log('  Sales Manager:      sales@schoolgroup.test');
  console.log('  Marketing Manager:  marketing@schoolgroup.test');
  console.log('  Service Agent:      agent@schoolgroup.test');
  console.log('  Customer (parent):  parent@schoolgroup.test');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[SEED] Failed:', err);
  process.exit(1);
});
