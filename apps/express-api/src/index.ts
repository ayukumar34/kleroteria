// Express
import express, { Application } from 'express';

// Cookie parser
import cookieParser from 'cookie-parser';

// Pino
import pinoHttp from 'pino-http';
import logger from './lib/logger';

// Routes
import usersRoute from './routes/users.route';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Pino
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/users', usersRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
