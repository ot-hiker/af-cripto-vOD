import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BtcTicker } from '@/components/BtcTicker';
import { NewsCard } from '@/components/NewsCard';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { NewsCardSkeleton } from '@/components/LoadingSpinner';
import { newsApi, aiApi, priceApi } from '@/lib/api';
import { formatCurrency, formatLargeNumber } from '@/lib/utils';
import { useBtcPrice } from '@/hooks/useBtcPrice';
import { News, DailySummary, PriceHistory } from '@/types';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

export function Dashboard() {
  const { price } = useBtcPrice();
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await newsApi.getAll({ limit: 6, page: 1 });
        setLatestNews(data.data);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchSummary = async () => {
      try {
        const data = await aiApi.getLatestSummary();
        setSummary(data.summary);
      } catch {
        // No summary yet
      } finally {
        setSummaryLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const data = await priceApi.getBtcHistory('24h');
        setPriceHistory(data.data);
      } catch {
        // Ignore
      }
    };

    fetchNews();
    fetchSummary();
    fetchHistory();
  }, []);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      await aiApi.generateSummary();
      const data = await aiApi.getLatestSummary();
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const isPositive = (price?.change_24h ?? 0) >= 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe o mercado de cripto e startups em tempo real
        </p>
      </div>

      {/* BTC Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main BTC Widget */}
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">₿</span>
                  </div>
                  <span className="font-semibold text-lg">Bitcoin</span>
                  <span className="text-xs text-muted-foreground">BTC</span>
                </div>
                {price ? (
                  <div className="font-mono font-bold text-4xl text-foreground tracking-tight">
                    {formatCurrency(price.usd)}
                  </div>
                ) : (
                  <div className="h-10 bg-muted rounded w-48 animate-pulse" />
                )}
                {price && (
                  <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{price.change_24h.toFixed(2)}% nas últimas 24h
                  </div>
                )}
              </div>
            </div>

            {/* Sparkline */}
            {priceHistory.length > 0 && (
              <div className="h-24 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        return (
                          <div className="bg-card border border-border rounded px-2 py-1 text-xs">
                            {formatCurrency(payload[0].value as number)}
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#4ade80' : '#f87171'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Volume 24h</span>
              </div>
              <div className="font-mono font-semibold text-lg">
                {price ? formatLargeNumber(price.volume_24h) : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Market Cap</span>
              </div>
              <div className="font-mono font-semibold text-lg">
                {price ? formatLargeNumber(price.market_cap) : '—'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Preço BRL</span>
              </div>
              <div className="font-mono font-semibold text-lg">
                {price ? `R$ ${price.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="text-lg">🤖</span>
              Resumo IA do Dia
              {summary && (
                <span className="text-xs font-normal text-muted-foreground">
                  via {summary.model_used} · {summary.news_count} notícias
                </span>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="text-xs"
            >
              {generatingSummary ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Gerar novo
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ) : summary ? (
            <MarkdownRenderer content={summary.content} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum resumo disponível para hoje.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="mt-3"
              >
                {generatingSummary ? 'Gerando...' : 'Gerar resumo agora'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest News */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Últimas Notícias</h2>
          <a href="/news" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Ver todas →
          </a>
        </div>
        {newsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
