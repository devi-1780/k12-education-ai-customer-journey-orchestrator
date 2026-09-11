import { Router } from 'express';
import * as ctrl from '../controllers/profile.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { attachOwnScope } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, attachOwnScope);

router.get('/', ctrl.listProfiles);
router.get('/:id', ctrl.getProfile);
router.post('/', authorize('admin', 'sales_manager', 'marketing_manager', 'service_agent'), validateBody(ctrl.profileSchema), ctrl.createProfile);
router.patch('/:id', authorize('admin', 'sales_manager', 'marketing_manager', 'service_agent'), ctrl.updateProfile);
router.get('/:id/consents', ctrl.getConsents);
router.put('/:id/consents', authorize('admin', 'marketing_manager', 'service_agent', 'customer'), validateBody(ctrl.upsertConsentSchema), ctrl.upsertConsent);

export default router;
