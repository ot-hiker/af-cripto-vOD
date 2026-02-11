import { google } from 'googleapis';
import pool from '../db/index';
import { summarizeNewsletter, classifyNews } from './aiService';

function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error('Google Service Account credentials not configured');
  }

  return new google.auth.JWT(email, undefined, key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
}

export async function fetchNewNewsletters(): Promise<number> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetsId) {
    console.log('[SHEETS] GOOGLE_SHEETS_ID not configured, skipping');
    return 0;
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetsId,
      range: 'Sheet1!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      console.log('[SHEETS] No rows found');
      return 0;
    }

    // Skip header row
    const dataRows = rows.slice(1);
    let inserted = 0;
    const rowsToUpdate: number[] = [];
    const newNewsIds: { id: number; title: string; summary: string | null }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const [date, from, subject, body, processed] = dataRows[i];

      if (processed === 'synced') continue;
      if (!subject || !from) continue;

      const content = (body || '').slice(0, 5000);

      let summary: string;
      try {
        summary = await summarizeNewsletter(subject, content);
        console.log(`[SHEETS] AI summary generated for: ${subject.slice(0, 50)}...`);
      } catch (err) {
        summary = content.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 300);
        console.log(`[SHEETS] AI summary failed, using fallback for: ${subject.slice(0, 50)}...`);
      }

      const publishedAt = date ? new Date(date) : new Date();

      try {
        const result = await pool.query(
          `INSERT INTO news (title, summary, content, source_name, source_type, published_at)
           VALUES ($1, $2, $3, $4, 'newsletter', $5)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [subject, summary, content, from, publishedAt]
        );

        if (result.rowCount && result.rowCount > 0) {
          inserted++;
          newNewsIds.push({ id: result.rows[0].id, title: subject, summary });
        }
        rowsToUpdate.push(i + 2); // +2 for 1-indexed and header row
      } catch (err) {
        console.error(`[SHEETS] Error inserting newsletter: ${(err as Error).message}`);
      }
    }

    // Update processed status in batches
    if (rowsToUpdate.length > 0) {
      const updateData = rowsToUpdate.map((rowNum) => ({
        range: `Sheet1!E${rowNum}`,
        values: [['synced']],
      }));

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetsId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updateData,
        },
      });
    }

    // Classify new newsletters with AI tags
    if (newNewsIds.length > 0) {
      try {
        await classifyNews(newNewsIds);
      } catch (err) {
        console.error(`[SHEETS] Classification failed: ${(err as Error).message}`);
      }
    }

    console.log(`[SHEETS] Inserted ${inserted} newsletters (with AI summaries)`);
    return inserted;
  } catch (err) {
    console.error(`[SHEETS] Error: ${(err as Error).message}`);
    return 0;
  }
}
