import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import pool from '../db/index';
import { chatWithContext, generateDailySummary } from '../services/aiService';

const router = Router();

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', chatRateLimit, async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (message.trim().length < 3) {
      res.status(400).json({ error: 'message must be at least 3 characters' });
      return;
    }

    const { reply, sources } = await chatWithContext(message);
    res.json({ reply, sources });
  } catch (err) {
    console.error('[AI] Chat error:', err);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

router.post('/summary/generate', async (_req: Request, res: Response) => {
  try {
    const summary = await generateDailySummary();
    res.json({ summary });
  } catch (err) {
    console.error('[AI] Generate summary error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM daily_summaries WHERE summary_date = $1',
      [date]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Summary not found for this date' });
      return;
    }

    res.json({ summary: result.rows[0] });
  } catch (err) {
    console.error('[AI] Get summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/summary/latest', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_summaries ORDER BY summary_date DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No summaries available' });
      return;
    }

    res.json({ summary: result.rows[0] });
  } catch (err) {
    console.error('[AI] Get latest summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
