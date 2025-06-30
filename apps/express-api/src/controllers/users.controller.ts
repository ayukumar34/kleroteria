// Express
import { Request, Response } from 'express';

// Crypto
import { randomBytes } from 'crypto';

// Bcrypt
import bcrypt from 'bcrypt';

// Database
import {
  db,
  schema,
  User,
  Session,
} from '@repo/database';
import { eq, and, lt, gt } from 'drizzle-orm';

// Utilitiess
import { asyncHandler } from '../utils/async-handler';

// Types

interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface SignInRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Helper function to generate user ID
const generateUserId = (): string => {
  return randomBytes(16).toString('hex');
};

// Helper function to generate session token
const generateSessionToken = (): string => {
  return randomBytes(32).toString('hex');
};

// Helper function to generate session ID
const generateSessionId = (): string => {
  return randomBytes(16).toString('hex');
};

// Sign Up Controller
export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
  }: SignUpRequest = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

  try {
    // Check conflict
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Conflict'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = generateUserId();
    const fullName = `${firstName} ${lastName}`;

    const [newUser]: User[] = await db.insert(schema.users).values({
      id: userId,
      name: fullName,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone,
      role: 'PARTICIPANT',
      emailVerified: false,
      phoneVerified: false,
    }).returning();

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    // Set session
    const sessionId = generateSessionId();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create session
    await db.insert(schema.sessions).values({
      id: sessionId,
      userId: userId,
      token: sessionToken,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt: expiresAt,
    });

    // Set cookies
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return user
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          emailVerified: newUser.emailVerified,
          phoneVerified: newUser.phoneVerified,
        }
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// Sign In Controller
export const signIn = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe }: SignInRequest = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

  try {
    // Find user
    const [user]: User[] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Create new session
    const sessionId = generateSessionId();
    const sessionToken = generateSessionToken();

    // Set session duration
    const sessionDuration = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + sessionDuration);

    // Delete expired sessions
    await db.delete(schema.sessions)
      .where(and(
        eq(schema.sessions.userId, user.id),
        lt(schema.sessions.expiresAt, new Date())
      ));

    // Create session
    await db.insert(schema.sessions).values({
      id: sessionId,
      userId: user.id,
      token: sessionToken,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent') || null,
      expiresAt,
    });

    // Set session cookie
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: sessionDuration,
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        }
      }
    });

  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// Sign Out Controller
export const signOut = asyncHandler(async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies?.sessionToken;

    if (sessionToken) {
      await db.delete(schema.sessions).where(eq(schema.sessions.token, sessionToken));
    }

    // Clear session
    res.clearCookie('sessionToken');

    res.status(200).json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Current User Controller
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get user
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get current user
    const [currentUser]: User[] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          emailVerified: currentUser.emailVerified,
          phoneVerified: currentUser.phoneVerified,
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});
