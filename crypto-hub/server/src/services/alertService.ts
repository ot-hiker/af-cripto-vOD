import pool from '../db/index';
import { getCachedPrice, fetchBtcPrice } from './priceService';
import { sendPriceAlert } from './emailService';

export async function checkAlerts(): Promise<void> {
  try {
    let price = getCachedPrice();
    if (!price) {
      price = await fetchBtcPrice();
    }

    const currentPrice = price.usd;

    const result = await pool.query(
      `SELECT id, email, target_price, direction
       FROM price_alerts
       WHERE is_active = true`
    );

    const alerts = result.rows;
    if (alerts.length === 0) return;

    for (const alert of alerts) {
      const targetPrice = parseFloat(alert.target_price);
      const shouldTrigger =
        (alert.direction === 'above' && currentPrice >= targetPrice) ||
        (alert.direction === 'below' && currentPrice <= targetPrice);

      if (shouldTrigger) {
        console.log(
          `[ALERT] Triggering alert ${alert.id} for ${alert.email}: BTC ${alert.direction} ${targetPrice}`
        );

        try {
          await sendPriceAlert(alert.email, targetPrice, currentPrice, alert.direction);

          await pool.query(
            `UPDATE price_alerts
             SET is_active = false, triggered_at = NOW(), email_sent = true
             WHERE id = $1`,
            [alert.id]
          );
        } catch (emailErr) {
          console.error(`[ALERT] Email failed for alert ${alert.id}: ${(emailErr as Error).message}`);
          // Mark as triggered but email_sent = false
          await pool.query(
            `UPDATE price_alerts
             SET is_active = false, triggered_at = NOW(), email_sent = false
             WHERE id = $1`,
            [alert.id]
          );
        }
      }
    }
  } catch (err) {
    console.error(`[ALERT] Check failed: ${(err as Error).message}`);
  }
}
