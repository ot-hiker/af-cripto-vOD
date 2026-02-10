import { Router, Request, Response } from 'express';
import pool from '../db/index';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const sourceType = req.query.source_type as string;
    const tag = req.query.tag as string;
    const search = req.query.search as string;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (sourceType && sourceType !== 'all') {
      conditions.push(`source_type = $${paramIdx++}`);
      params.push(sourceType);
    }

    if (tag) {
      conditions.push(`$${paramIdx++} = ANY(tags)`);
      params.push(tag);
    }

    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR summary ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM news ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT id, title, summary, url, source_name, source_type, image_url, tags, published_at, created_at
       FROM news ${whereClause}
       ORDER BY published_at DESC NULLS LAST
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[NEWS] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'News not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[NEWS] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
