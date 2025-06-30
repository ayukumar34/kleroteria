// Express
import express, { Application } from 'express';

// Environment
import dotenv from 'dotenv';
dotenv.config();

// Cookie Parser
import cookieParser from 'cookie-parser';

// CORS
import cors from 'cors';

// Pino
import pinoHttp from 'pino-http';
import logger from './lib/logger';

// Routes
import usersRoute from './routes/users.route';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Pino Middleware
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/users', usersRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
