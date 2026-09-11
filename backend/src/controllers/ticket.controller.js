import { z } from 'zod';
import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';
import { logAudit } from '../services/audit.service.js';

export const createTicketSchema = z.object({
  profileId: z.string(),
  subject: z.string().min(2),
  category: z.enum(['admission', 'timetable_planning', 'teaching', 'assessment', 'attendance', 'parent_communication', 'support_intervention', 'reporting']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  initialMessage: z.string().optional(),
});

export const actionSchema = z.object({
  reason: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  subject: z.string().optional(),
});

function scoped(req) {
  const base = { organisationId: req.user.organisationId, isDeleted: false };
  if (req.user.role === 'customer') base.profileId = { $in: req.user.ownProfileIds || [] };
  return base;
}

export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = scoped(req);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.profileId) filter.profileId = req.query.profileId;

  const [items, total] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('profileId', 'fullName entityType').populate('assignedTo', 'name'),
    Ticket.countDocuments(filter),
  ]);
  return ApiResponse.ok(res, 'Tickets fetched', items, buildMeta(page, limit, total));
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, ...scoped(req) }).populate('profileId').populate('assignedTo', 'name email');
  if (!ticket) throw ApiError.notFound('Ticket not found');
  const messages = await Message.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
  return ApiResponse.ok(res, 'Ticket fetched', { ticket, messages });
});

export const createTicket = asyncHandler(async (req, res) => {
  const { profileId, subject, category, priority, initialMessage } = req.body;
  const ticket = await Ticket.create({
    organisationId: req.user.organisationId,
    profileId,
    subject,
    category,
    priority,
    createdByUserId: req.user.id,
    history: [{ action: 'created', actorId: req.user.id, newValue: { subject }, at: new Date() }],
  });
  if (initialMessage) {
    await Message.create({
      organisationId: req.user.organisationId,
      ticketId: ticket._id,
      profileId,
      channel: 'in_app',
      direction: 'inbound',
      body: initialMessage,
      status: 'sent',
    });
  }
  await logAudit({ req, action: 'ticket.create', entityType: 'Ticket', entityId: ticket._id, newValue: ticket });
  return ApiResponse.created(res, 'Ticket created', ticket);
});

async function applyTicketAction(req, action, mutate) {
  const ticket = await Ticket.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const requiresReason = ['rejected', 'overridden', 'deferred'].includes(action);
  if (requiresReason && !req.body.reason) throw ApiError.badRequest('A reason is required for this action');

  const previousValue = { status: ticket.status, assignedTo: ticket.assignedTo, priority: ticket.priority, subject: ticket.subject };
  mutate(ticket);
  ticket.version += 1;
  ticket.history.push({
    action,
    actorId: req.user.id,
    previousValue,
    newValue: { status: ticket.status, assignedTo: ticket.assignedTo, priority: ticket.priority, subject: ticket.subject },
    reason: req.body.reason,
    at: new Date(),
  });
  await ticket.save();
  await logAudit({ req, action: `ticket.${action}`, entityType: 'Ticket', entityId: ticket._id, previousValue, newValue: ticket, reason: req.body.reason });
  return ticket;
}

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'assigned', (t) => { t.assignedTo = req.body.assignedTo; t.status = 'in_progress'; });
  return ApiResponse.ok(res, 'Ticket assigned', ticket);
});

export const editTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'edited', (t) => {
    if (req.body.subject) t.subject = req.body.subject;
    if (req.body.priority) t.priority = req.body.priority;
  });
  return ApiResponse.ok(res, 'Ticket updated', ticket);
});

export const approveTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'approved', (t) => { t.status = 'in_progress'; });
  return ApiResponse.ok(res, 'Ticket approved', ticket);
});

export const rejectTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'rejected', (t) => { t.status = 'open'; });
  return ApiResponse.ok(res, 'Ticket rejected', ticket);
});

export const deferTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'deferred', (t) => { t.status = 'deferred'; });
  return ApiResponse.ok(res, 'Ticket deferred', ticket);
});

export const overrideTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'overridden', (t) => {
    if (req.body.status) t.status = req.body.status;
  });
  return ApiResponse.ok(res, 'Ticket overridden', ticket);
});

export const escalateTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'escalated', (t) => { t.status = 'escalated'; t.priority = 'urgent'; });
  return ApiResponse.ok(res, 'Ticket escalated', ticket);
});

export const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await applyTicketAction(req, 'closed', (t) => { t.status = 'closed'; });
  return ApiResponse.ok(res, 'Ticket closed', ticket);
});

export const addMessageSchema = z.object({
  body: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push', 'call', 'in_app']).optional(),
  idempotencyKey: z.string().optional(),
});

export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, organisationId: req.user.organisationId, isDeleted: false });
  if (!ticket) throw ApiError.notFound('Ticket not found');

  if (req.body.idempotencyKey) {
    const existing = await Message.findOne({ idempotencyKey: req.body.idempotencyKey });
    if (existing) return ApiResponse.ok(res, 'Message already sent (idempotent)', existing);
  }

  const message = await Message.create({
    organisationId: req.user.organisationId,
    ticketId: ticket._id,
    profileId: ticket.profileId,
    channel: req.body.channel || 'in_app',
    direction: 'outbound',
    author: req.user.id,
    body: req.body.body,
    status: 'sent',
    idempotencyKey: req.body.idempotencyKey,
  });
  await logAudit({ req, action: 'message.send', entityType: 'Message', entityId: message._id, newValue: message });
  return ApiResponse.created(res, 'Message sent', message);
});
