import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.listUsers);
router.post('/', validateBody(ctrl.createUserSchema), ctrl.createUser);
router.patch('/:id', validateBody(ctrl.updateUserSchema), ctrl.updateUser);
router.post('/:id/deactivate', ctrl.deactivateUser);
router.post('/:id/activate', ctrl.activateUser);

export default router;
