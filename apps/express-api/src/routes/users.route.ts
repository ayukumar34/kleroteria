// Express
import { Router } from 'express';

// Controllers
import { signUp, signIn, signOut, getCurrentUser } from '../controllers/users.controller';

// Middleware
import { authenticateUser } from '../middleware/users.middleware';

const router: Router = Router();

// Unprotected routes
router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.post('/sign-out', signOut);

// Protected routes
router.get('/me', authenticateUser, getCurrentUser);

export default router;
