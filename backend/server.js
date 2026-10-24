
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { getDbPool } from './config/db.js';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 8 * 60 * 60 * 1000,
});

app.use(
  session({
    name: 'campusfix.sid',
    secret: process.env.SESSION_SECRET || '',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CampusFix API' });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await getDbPool().query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Database unavailable or not configured',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  console.error('Request failed:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  console.error('SESSION_SECRET must contain at least 32 characters.');
  process.exit(1);
}

const server = app.listen(PORT, HOST, () => {
  console.log(`CampusFix API listening on ${HOST}:${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    sessionStore.close(() => {});

    try {
      await getDbPool().end();
    } catch {
      // The database pool may not have been initialized.
    }

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
