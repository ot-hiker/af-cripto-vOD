import { Router, Request, Response } from 'express';
import { fetchBtcPrice, getPriceHistory } from '../services/priceService';

const router = Router();

router.get('/btc', async (_req: Request, res: Response) => {
  try {
    const price = await fetchBtcPrice();
    res.json(price);
  } catch (err) {
    console.error('[PRICE] Route error:', err);
    res.status(503).json({ error: 'Price service unavailable' });
  }
});

router.get('/btc/history', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as '1h' | '24h' | '7d') || '24h';
    if (!['1h', '24h', '7d'].includes(period)) {
      res.status(400).json({ error: 'Invalid period. Use: 1h, 24h, 7d' });
      return;
    }

    const data = await getPriceHistory(period);
    res.json({ data });
  } catch (err) {
    console.error('[PRICE] History error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
