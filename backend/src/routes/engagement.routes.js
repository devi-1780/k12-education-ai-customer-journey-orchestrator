import { Router } from 'express';
import * as ctrl from '../controllers/engagement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate);
const marketing = authorize('admin', 'marketing_manager', 'sales_manager');

router.get('/segments', ctrl.listSegments);
router.post('/segments', marketing, validateBody(ctrl.segmentSchema), ctrl.createSegment);

router.get('/campaigns', ctrl.listCampaigns);
router.post('/campaigns', marketing, validateBody(ctrl.campaignSchema), ctrl.createCampaign);
router.post('/campaigns/:id/approve', authorize('admin', 'marketing_manager'), ctrl.approveCampaign);
router.post('/campaigns/:id/reject', authorize('admin', 'marketing_manager'), ctrl.rejectCampaign);
router.post('/campaigns/:id/launch', marketing, ctrl.launchCampaign);

router.get('/nba-queue', ctrl.getNBAQueue);

export default router;
