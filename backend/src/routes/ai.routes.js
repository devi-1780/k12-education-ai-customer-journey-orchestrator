import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/recommendations', ctrl.listRecommendations);
router.post('/intent-sentiment', aiLimiter, validateBody(ctrl.intentSentimentSchema), ctrl.runIntentSentiment);
router.post('/churn-propensity', aiLimiter, validateBody(ctrl.churnSchema), ctrl.runChurnPropensity);
router.post('/next-best-action', aiLimiter, validateBody(ctrl.nbaSchema), ctrl.runNextBestAction);
router.post('/draft-response', aiLimiter, authorize('admin', 'service_agent'), validateBody(ctrl.draftSchema), ctrl.runDraftResponse);
router.post('/summarize', aiLimiter, authorize('admin', 'service_agent'), validateBody(ctrl.summarySchema), ctrl.runSummarizeConversation);
router.post('/recommendations/:id/review', authorize('admin', 'service_agent', 'marketing_manager', 'sales_manager'), validateBody(ctrl.reviewSchema), ctrl.reviewRecommendation);

export default router;
