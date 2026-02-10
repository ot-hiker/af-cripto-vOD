import pool from '../db/index';

interface BtcPrice {
  usd: number;
  brl: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

let priceCache: BtcPrice | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function fetchBtcPrice(): Promise<BtcPrice> {
  const now = Date.now();
  if (priceCache && now - lastFetchTime < CACHE_TTL) {
    return priceCache;
  }

  try {
    const url =
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json() as {
      bitcoin: {
        usd: number;
        brl: number;
        usd_24h_change: number;
        usd_24h_vol: number;
        usd_market_cap: number;
      };
    };

    const btc = data.bitcoin;
    priceCache = {
      usd: btc.usd,
      brl: btc.brl,
      change_24h: btc.usd_24h_change,
      volume_24h: btc.usd_24h_vol,
      market_cap: btc.usd_market_cap,
      last_updated: new Date().toISOString(),
    };
    lastFetchTime = now;

    console.log(`[PRICE] BTC updated: $${priceCache.usd}`);
    return priceCache;
  } catch (err) {
    console.error(`[PRICE] Error fetching BTC price: ${(err as Error).message}`);
    if (priceCache) {
      console.log('[PRICE] Returning cached price');
      return priceCache;
    }
    throw err;
  }
}

export async function savePriceHistory(): Promise<void> {
  try {
    const price = await fetchBtcPrice();
    await pool.query(
      'INSERT INTO btc_price_history (price_usd, price_brl) VALUES ($1, $2)',
      [price.usd, price.brl]
    );
    console.log('[PRICE] Price history saved');
  } catch (err) {
    console.error(`[PRICE] Error saving history: ${(err as Error).message}`);
  }
}

export function getCachedPrice(): BtcPrice | null {
  return priceCache;
}

export async function getPriceHistory(
  period: '1h' | '24h' | '7d'
): Promise<{ price: number; timestamp: string }[]> {
  const intervals: Record<string, string> = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
  };

  const interval = intervals[period] || '24 hours';

  const result = await pool.query(
    `SELECT price_usd as price, recorded_at as timestamp
     FROM btc_price_history
     WHERE recorded_at >= NOW() - INTERVAL '${interval}'
     ORDER BY recorded_at ASC`
  );

  return result.rows.map((row: { price: string; timestamp: Date }) => ({
    price: parseFloat(row.price),
    timestamp: row.timestamp.toISOString(),
  }));
}
