import { Router } from 'express';
import * as ctrl from '../controllers/journey.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { attachOwnScope } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, attachOwnScope);

router.get('/stages', ctrl.journeyStages);
router.get('/', ctrl.listInteractions);
router.post('/', authorize('admin', 'sales_manager', 'marketing_manager', 'service_agent'), validateBody(ctrl.interactionSchema), ctrl.createInteraction);

export default router;
