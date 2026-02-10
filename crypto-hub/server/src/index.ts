import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
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
    // 1. Connect to DB
    await connectDB();

    // 2. Initialize schema
    await initSchema();

    // 3. Start Express
    app.listen(PORT, () => {
      console.log(`\n🚀 CryptoHub server running on port ${PORT}`);
    });

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
    console.error('[BOOT] Fatal error:', err);
    process.exit(1);
  }
}

bootstrap();
