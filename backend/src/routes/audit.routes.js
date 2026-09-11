import { Router } from 'express';
import * as ctrl from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();
// Read-only for admins; no PATCH/DELETE routes exist for this resource anywhere in the API.
router.use(authenticate, authorize('admin'));
router.get('/', ctrl.listAuditLogs);

export default router;
