import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin', 'sales_manager', 'marketing_manager', 'service_agent'));

router.get('/', ctrl.listReports);
router.post('/', validateBody(ctrl.reportSchema), ctrl.generateReport);
router.get('/:id/download', ctrl.downloadReport);

export default router;
