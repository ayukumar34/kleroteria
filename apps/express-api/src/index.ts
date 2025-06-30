// Express
import express, { Application } from 'express';

// Pino
import pinoHttp from 'pino-http';
import logger from './lib/logger';

const app: Application = express();

// Middleware
app.use(express.json());

// Pino
app.use(pinoHttp({ logger }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
