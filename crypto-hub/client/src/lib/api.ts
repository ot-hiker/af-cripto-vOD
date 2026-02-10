const BASE_URL = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// News API
export const newsApi = {
  getAll: (params: Record<string, string | number>) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return fetchJSON<import('../types').NewsResponse>(`/news?${query}`);
  },

  getById: (id: number) => fetchJSON<import('../types').News>(`/news/${id}`),
};

// Price API
export const priceApi = {
  getBtc: () => fetchJSON<import('../types').BtcPrice>('/price/btc'),
  getBtcHistory: (period: '1h' | '24h' | '7d') =>
    fetchJSON<{ data: import('../types').PriceHistory[] }>(`/price/btc/history?period=${period}`),
};

// AI API
export const aiApi = {
  chat: (message: string) =>
    fetchJSON<{ reply: string; sources: import('../types').ChatSource[] }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getLatestSummary: () =>
    fetchJSON<{ summary: import('../types').DailySummary }>('/ai/summary/latest'),

  getSummary: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return fetchJSON<{ summary: import('../types').DailySummary }>(`/ai/summary${query}`);
  },

  generateSummary: () =>
    fetchJSON<{ summary: string }>('/ai/summary/generate', { method: 'POST' }),
};

// Alerts API
export const alertsApi = {
  create: (data: { email: string; target_price: number; direction: 'above' | 'below' }) =>
    fetchJSON<{ id: number; message: string }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByEmail: (email: string) =>
    fetchJSON<import('../types').PriceAlert[]>(`/alerts?email=${encodeURIComponent(email)}`),

  delete: (id: number) =>
    fetchJSON<{ message: string }>(`/alerts/${id}`, { method: 'DELETE' }),
};

// Health check
export const healthApi = {
  check: () =>
    fetchJSON<{ status: string; uptime: number; db: string; lastNewsFetch: string }>('/health'),
};
