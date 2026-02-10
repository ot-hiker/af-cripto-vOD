import { useState, useEffect, useCallback } from 'react';
import { BtcPrice } from '../types';
import { priceApi } from '../lib/api';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useBtcPrice() {
  const [price, setPrice] = useState<BtcPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const data = await priceApi.getBtc();
      setPrice(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, error, refresh: fetchPrice };
}
