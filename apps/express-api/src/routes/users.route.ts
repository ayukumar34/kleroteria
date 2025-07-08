// Express
import { Router } from 'express';

// Controllers
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  sendEmailVerificationCode,
  resendEmailVerificationCode,
  verifyEmailVerificationCode,
} from '../controllers/users.controller';

// Middleware
import { authenticateUser } from '../middleware/users.middleware';

const router: Router = Router();

// Unprotected routes
router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', signOut);

// Protected routes
router.get('/me', authenticateUser, getCurrentUser);
router.post('/send-email-verification', authenticateUser, sendEmailVerificationCode);
router.post('/resend-email-verification', authenticateUser, resendEmailVerificationCode);
router.post('/verify-email-verification', authenticateUser, verifyEmailVerificationCode);

export default router;
