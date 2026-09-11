import { Router } from 'express';
import * as ctrl from '../controllers/config.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.listConfig);
router.put('/', validateBody(ctrl.configSchema), ctrl.upsertConfig);

export default router;
