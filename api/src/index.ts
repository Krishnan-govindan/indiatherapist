import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { logger } from './lib/logger';

// ── Cron imports ─────────────────────────────────────────────
import { registerFollowUpCron } from './cron/followUpRunner';
import { registerReminderCron } from './cron/reminderSender';
import { registerSlotExpiryCron } from './cron/slotExpiry';

// ── Route imports ────────────────────────────────────────────
import leadsRouter from './routes/leads';
import therapistsRouter from './routes/therapists';
import appointmentsRouter from './routes/appointments';
import adminRouter from './routes/admin';
import checkoutRouter from './routes/checkout';

// ── Webhook imports ──────────────────────────────────────────
import metaWhatsappRouter from './webhooks/metaWhatsapp';
import vapiRouter from './webhooks/vapi';
import stripeRouter from './webhooks/stripe';

// ─────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
  'https://web-production-7bea1.up.railway.app',
  'https://www.indiatherapist.com',
  'https://indiatherapist.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsers ─────────────────────────────────────────────
// Stripe webhooks require the raw body for signature verification —
// mount the raw parser BEFORE the JSON parser so stripe route gets it.
app.use(
  '/webhooks/stripe',
  express.raw({ type: 'application/json', limit: '10mb' })
);

// All other routes use JSON
app.use(express.json({ limit: '10mb' }));

// ── Health check ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'india-therapist-api' });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/leads', leadsRouter);
app.use('/api/therapists', therapistsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/checkout', checkoutRouter);

// ── Webhook routes ───────────────────────────────────────────
app.use('/webhooks/meta-wa', metaWhatsappRouter);
app.use('/webhooks/vapi', vapiRouter);
app.use('/webhooks/stripe', stripeRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ─────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });

  // ── Register cron jobs ──────────────────────────────────────
  registerFollowUpCron();   // every hour      — drip sequences
  registerReminderCron();   // every 30 min    — session reminders
  registerSlotExpiryCron(); // every 2 hours   — slot offer expiry
});

export default app;
