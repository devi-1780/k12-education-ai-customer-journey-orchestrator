import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/outcomes-summary', ctrl.getOutcomesSummary);

export default router;
