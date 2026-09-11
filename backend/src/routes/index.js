import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import journeyRoutes from './journey.routes.js';
import ticketRoutes from './ticket.routes.js';
import engagementRoutes from './engagement.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';
import reportRoutes from './report.routes.js';
import userRoutes from './user.routes.js';
import auditRoutes from './audit.routes.js';
import configRoutes from './config.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/journey', journeyRoutes);
router.use('/tickets', ticketRoutes);
router.use('/engagement', engagementRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/config', configRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
