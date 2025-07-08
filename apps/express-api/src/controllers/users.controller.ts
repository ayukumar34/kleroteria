// Express
import { Request, Response } from 'express';

// Crypto
import { randomBytes, randomInt } from 'crypto';

// Bcrypt
import bcrypt from 'bcrypt';

// Resend
import { Resend } from 'resend';

// Database
import {
  db,
  schema,
  User,
  Session,
  Token,
} from '@repo/database';
import { eq, and, lt, gt } from 'drizzle-orm';

// Utilities
import { asyncHandler } from '../utils/async-handler';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

interface VerifyEmailVerificationCodeRequest {
  code: string;
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

// Helper function to generate code
const generateCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = randomInt(0, characters.length);
    result += characters[randomIndex];
  }

  return result;
};

// Helper function to generate token ID
const generateTokenId = (): string => {
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
      role: "FREE",
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

// Send Email Verification Code Controller
export const sendEmailVerificationCode = asyncHandler(async (req: Request, res: Response) => {
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

    // Get existing valid token
    const [existingValidToken]: Token[] = await db.select()
      .from(schema.tokens)
      .where(and(
        eq(schema.tokens.userId, currentUser.id),
        eq(schema.tokens.type, 'EMAIL'),
        eq(schema.tokens.status, 'PENDING'),
        gt(schema.tokens.expiresAt, new Date())
      ))
      .limit(1);

    if (existingValidToken) {
      return res.status(200).json({
        success: true,
        data: {
          token: {
            id: existingValidToken.id,
            userId: existingValidToken.userId,
            code: existingValidToken.code,
            type: existingValidToken.type,
            status: existingValidToken.status,
            createdAt: existingValidToken.createdAt,
            updatedAt: existingValidToken.updatedAt,
            expiresAt: existingValidToken.expiresAt,
          }
        }
      });
    }

    // Generate verification code
    const verificationCode = generateCode();
    const tokenId = generateTokenId();

    // Expire all tokens
    await db.update(schema.tokens)
      .set({ status: 'EXPIRED' })
      .where(and(
        eq(schema.tokens.userId, currentUser.id),
        eq(schema.tokens.type, 'EMAIL')
      ));

    // Create new token
    const [newToken]: Token[] = await db.insert(schema.tokens).values({
      id: tokenId,
      userId: currentUser.id,
      code: verificationCode,
      type: 'EMAIL',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).returning();

    if (!newToken) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Kleroteria <onboarding@resend.dev>',
      to: "bigtexascompsci@proton.me",
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${currentUser.firstName},</p>
          <p>Please use the following verification code to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="font-size: 32px; margin: 0; color: #333; letter-spacing: 4px;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
          <p>Best regards,<br>The Kleroteria Team</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        token: {
          id: newToken.id,
          userId: newToken.userId,
          code: newToken.code,
          type: newToken.type,
          status: newToken.status,
          createdAt: newToken.createdAt,
          updatedAt: newToken.updatedAt,
          expiresAt: newToken.expiresAt,
        }
      }
    });

  } catch (error) {
    console.error('Send email verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// Resend Email Verification Code Controller
export const resendEmailVerificationCode = asyncHandler(async (req: Request, res: Response) => {
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

    // Generate verification code
    const verificationCode = generateCode();
    const tokenId = generateTokenId();

    // Expire all existing tokens
    await db.update(schema.tokens)
      .set({ status: 'EXPIRED' })
      .where(and(
        eq(schema.tokens.userId, currentUser.id),
        eq(schema.tokens.type, 'EMAIL')
      ));

    // Create new token
    const [newToken]: Token[] = await db.insert(schema.tokens).values({
      id: tokenId,
      userId: currentUser.id,
      code: verificationCode,
      type: 'EMAIL',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }).returning();

    if (!newToken) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Kleroteria <onboarding@resend.dev>',
      to: "bigtexascompsci@proton.me",
      subject: 'Email Verification Code - Resent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification - Resent</h2>
          <p>Hello ${currentUser.firstName},</p>
          <p>You requested a new verification code. Please use the following code to verify your email address:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="font-size: 32px; margin: 0; color: #333; letter-spacing: 4px;">${verificationCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
          <p>Best regards,<br>The Kleroteria Team</p>
        </div>
      `,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token: {
          id: newToken.id,
          userId: newToken.userId,
          code: newToken.code,
          type: newToken.type,
          status: newToken.status,
          createdAt: newToken.createdAt,
          updatedAt: newToken.updatedAt,
          expiresAt: newToken.expiresAt,
        }
      }
    });

  } catch (error) {
    console.error('Resend email verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

// Verify Email Verification Code Controller
export const verifyEmailVerificationCode = asyncHandler(async (req: Request, res: Response) => {
  const { code }: VerifyEmailVerificationCodeRequest = req.body;

  // Validate required fields
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

  // Validate code format
  if (code.length !== 6 || !/^[A-Za-z0-9]+$/.test(code)) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request'
    });
  }

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

    // Find valid token
    const [validToken]: Token[] = await db.select()
      .from(schema.tokens)
      .where(and(
        eq(schema.tokens.userId, currentUser.id),
        eq(schema.tokens.code, code.toUpperCase()),
        eq(schema.tokens.type, 'EMAIL'),
        eq(schema.tokens.status, 'PENDING'),
        gt(schema.tokens.expiresAt, new Date())
      ))
      .limit(1);

    if (!validToken) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }

    // Update token status
    await db.update(schema.tokens)
      .set({ status: 'EXPIRED' })
      .where(eq(schema.tokens.id, validToken.id));

    // Update email verification status
    await db.update(schema.users)
      .set({ emailVerified: true })
      .where(eq(schema.users.id, currentUser.id));

    // Expire all other tokens
    await db.update(schema.tokens)
      .set({ status: 'EXPIRED' })
      .where(and(
        eq(schema.tokens.userId, currentUser.id),
        eq(schema.tokens.type, 'EMAIL'),
        eq(schema.tokens.status, 'PENDING')
      ));

    res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.error('Verify email verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

