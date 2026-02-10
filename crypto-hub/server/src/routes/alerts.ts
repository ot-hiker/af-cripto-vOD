import { Router, Request, Response } from 'express';
import pool from '../db/index';

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, target_price, direction } = req.body;

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    const price = parseFloat(target_price);
    if (isNaN(price) || price <= 0) {
      res.status(400).json({ error: 'target_price must be a positive number' });
      return;
    }

    if (!direction || !['above', 'below'].includes(direction)) {
      res.status(400).json({ error: 'direction must be "above" or "below"' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO price_alerts (email, target_price, direction)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email, price, direction]
    );

    res.status(201).json({
      id: result.rows[0].id,
      message: 'Alerta criado com sucesso',
    });
  } catch (err) {
    console.error('[ALERT] Create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '');

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'Valid email query parameter is required' });
      return;
    }

    const result = await pool.query(
      `SELECT id, email, target_price, direction, is_active, triggered_at, email_sent, created_at
       FROM price_alerts
       WHERE email = $1
       ORDER BY created_at DESC`,
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[ALERT] Get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const result = await pool.query('DELETE FROM price_alerts WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json({ message: 'Alerta removido' });
  } catch (err) {
    console.error('[ALERT] Delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
