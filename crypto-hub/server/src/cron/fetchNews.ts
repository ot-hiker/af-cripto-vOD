import cron from 'node-cron';
import { fetchAllFeeds } from '../services/rssService';
import { fetchNewNewsletters } from '../services/sheetsService';
import { classifyNews } from '../services/aiService';
import { savePriceHistory, fetchBtcPrice } from '../services/priceService';
import { checkAlerts } from '../services/alertService';
import { generateDailySummary } from '../services/aiService';
import pool from '../db/index';

export function registerCronJobs(): void {
  // Fetch RSS feeds every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Running RSS fetch...');
    try {
      const inserted = await fetchAllFeeds();

      if (inserted > 0) {
        // Classify untagged news in batch
        const result = await pool.query(
          `SELECT id, title, summary FROM news
           WHERE tags = '{}' OR tags IS NULL
           ORDER BY created_at DESC
           LIMIT 20`
        );

        if (result.rows.length > 0) {
          await classifyNews(result.rows);
        }
      }
    } catch (err) {
      console.error('[CRON] RSS fetch error:', err);
    }
  });

  // Fetch newsletters from Google Sheets every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running Sheets fetch...');
    try {
      await fetchNewNewsletters();
    } catch (err) {
      console.error('[CRON] Sheets fetch error:', err);
    }
  });

  // Save BTC price history every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await savePriceHistory();
    } catch (err) {
      console.error('[CRON] Price history save error:', err);
    }
  });

  // Check price alerts every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkAlerts();
    } catch (err) {
      console.error('[CRON] Alert check error:', err);
    }
  });

  // Refresh BTC price every 30 seconds (separate from saving history)
  cron.schedule('*/1 * * * *', async () => {
    try {
      await fetchBtcPrice();
    } catch (err) {
      console.error('[CRON] Price refresh error:', err);
    }
  });

  // Generate daily AI summary at 08:00 UTC
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Generating daily summary...');
    try {
      await generateDailySummary();
    } catch (err) {
      console.error('[CRON] Daily summary error:', err);
    }
  });

  console.log('[CRON] All cron jobs registered');
}
