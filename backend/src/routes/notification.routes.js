import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.listNotifications);
router.post('/:id/read', ctrl.markRead);
router.post('/read-all', ctrl.markAllRead);
router.post('/clear', ctrl.clearNotifications);

export default router;
