import { Router } from 'express';
import * as ctrl from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { attachOwnScope } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, attachOwnScope);
const staff = authorize('admin', 'service_agent', 'sales_manager', 'marketing_manager');

router.get('/', ctrl.listTickets);
router.get('/:id', ctrl.getTicket);
router.post('/', validateBody(ctrl.createTicketSchema), ctrl.createTicket);
router.post('/:id/messages', validateBody(ctrl.addMessageSchema), ctrl.addMessage);

router.patch('/:id', staff, validateBody(ctrl.actionSchema), ctrl.editTicket);
router.post('/:id/assign', staff, validateBody(ctrl.actionSchema), ctrl.assignTicket);
router.post('/:id/approve', staff, validateBody(ctrl.actionSchema), ctrl.approveTicket);
router.post('/:id/reject', staff, validateBody(ctrl.actionSchema), ctrl.rejectTicket);
router.post('/:id/defer', staff, validateBody(ctrl.actionSchema), ctrl.deferTicket);
router.post('/:id/override', staff, validateBody(ctrl.actionSchema), ctrl.overrideTicket);
router.post('/:id/escalate', staff, validateBody(ctrl.actionSchema), ctrl.escalateTicket);
router.post('/:id/close', staff, validateBody(ctrl.actionSchema), ctrl.closeTicket);

export default router;
