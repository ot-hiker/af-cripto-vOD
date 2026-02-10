import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  console.log('[DB] Connected to PostgreSQL');
  client.release();
}

export async function initSchema(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
  console.log('[DB] Schema initialized');
}

export { pool };
export default pool;
