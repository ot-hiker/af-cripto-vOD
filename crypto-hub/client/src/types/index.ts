export interface News {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  url: string | null;
  source_name: string | null;
  source_type: 'rss' | 'newsletter' | 'manual';
  image_url: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
}

export interface NewsResponse {
  data: News[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BtcPrice {
  usd: number;
  brl: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface PriceHistory {
  price: number;
  timestamp: string;
}

export interface DailySummary {
  id: number;
  summary_date: string;
  content: string;
  model_used: string;
  news_count: number;
  created_at: string;
}

export interface PriceAlert {
  id: number;
  email: string;
  target_price: string;
  direction: 'above' | 'below';
  is_active: boolean;
  triggered_at: string | null;
  email_sent: boolean;
  created_at: string;
}

export interface ChatSource {
  id: number;
  title: string;
  url: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
}
