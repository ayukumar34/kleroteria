// Express
import {
  Request,
  Response,
  NextFunction,
} from 'express';

// Database
import {
  db,
  schema,
  User,
  Session,
} from '@repo/database';
import {
  eq,
  and,
  gt,
} from 'drizzle-orm';

// Utilities
import { asyncHandler } from '../utils/async-handler';

export const authenticateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get session token
    const sessionToken = req.cookies?.sessionToken;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find session by token
    const [session]: Session[] = await db.select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.token, sessionToken),
        gt(schema.sessions.expiresAt, new Date())
      ))
      .limit(1);

    if (!session) {
      res.clearCookie('sessionToken');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Find user by session userId
    const [user]: User[] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!user) {
      res.clearCookie('sessionToken');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    (req as any).user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      role: user.role,
    };
    (req as any).sessionId = session.id;

    next();
  } catch (error) {
    console.error('Authenticate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

export const requireRole = (roles: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    next();
  });
}; 