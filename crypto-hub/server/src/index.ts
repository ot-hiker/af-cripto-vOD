import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { connectDB, initSchema } from './db/index';
import newsRouter from './routes/news';
import priceRouter from './routes/price';
import alertsRouter from './routes/alerts';
import aiRouter from './routes/ai';
import { registerCronJobs } from './cron/fetchNews';
import { fetchAllFeeds } from './services/rssService';
import { fetchBtcPrice } from './services/priceService';

const app = express();
const PORT = process.env.PORT || 3001;

const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const AUTH_TOKEN_SECRET = crypto.randomBytes(32).toString('hex');
const validTokens = new Set<string>();

function generateAuthToken(): string {
  const token = crypto.createHmac('sha256', AUTH_TOKEN_SECRET)
    .update(Date.now().toString() + Math.random().toString())
    .digest('hex');
  validTokens.add(token);
  return token;
}

let lastNewsFetch = 'never';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (!SITE_PASSWORD) {
    return res.json({ success: true, token: 'open' });
  }

  if (password === SITE_PASSWORD) {
    const token = generateAuthToken();
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, error: 'Senha incorreta' });
});

app.get('/api/auth/check', (req, res) => {
  if (!SITE_PASSWORD) {
    return res.json({ authenticated: true });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && (token === 'open' || validTokens.has(token))) {
    return res.json({ authenticated: true });
  }

  return res.json({ authenticated: false });
});

// Auth middleware (after auth routes, before other API routes)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/health') return next();
  if (!SITE_PASSWORD) return next();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && (token === 'open' || validTokens.has(token))) return next();
  res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
});

// Health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    const { pool } = await import('./db/index');
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: dbStatus,
    lastNewsFetch,
  });
});

// Routes
app.use('/api/news', newsRouter);
app.use('/api/price', priceRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/ai', aiRouter);

// Serve static frontend
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap(): Promise<void> {
  try {
    // 1. Start Express (moved before DB connection to pass health checks)
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 CryptoHub server running on port ${PORT}`);
    });

    if (SITE_PASSWORD) console.log('[AUTH] Password protection ENABLED');
    else console.log('[AUTH] No SITE_PASSWORD set — open access');

    // 2. Connect to DB
    try {
      await connectDB();
      // 3. Initialize schema
      await initSchema();
    } catch (err) {
      console.error('[BOOT] Database connection failed:', err);
    }

    // 4. Register cron jobs
    registerCronJobs();

    // 5. Initial data fetch
    console.log('[BOOT] Running initial RSS fetch...');
    try {
      await fetchAllFeeds();
      lastNewsFetch = new Date().toISOString();
    } catch (err) {
      console.error('[BOOT] Initial RSS fetch failed:', err);
    }

    console.log('[BOOT] Fetching initial BTC price...');
    try {
      await fetchBtcPrice();
    } catch (err) {
      console.error('[BOOT] Initial BTC price fetch failed:', err);
    }

    console.log('[BOOT] Server ready!');
  } catch (err) {
    console.error('[BOOT] Fatal error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
