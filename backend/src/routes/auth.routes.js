import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginLimiter, passwordResetLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', validateBody(ctrl.registerSchema), ctrl.register);
router.post('/login', loginLimiter, validateBody(ctrl.loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/forgot-password', passwordResetLimiter, validateBody(ctrl.forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateBody(ctrl.resetPasswordSchema), ctrl.resetPassword);

export default router;
