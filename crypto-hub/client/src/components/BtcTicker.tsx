import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { useBtcPrice } from '@/hooks/useBtcPrice';
import { formatCurrency, formatCurrencyBRL } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BtcTickerProps {
  compact?: boolean;
  className?: string;
}

export function BtcTicker({ compact = false, className }: BtcTickerProps) {
  const { price, loading, error } = useBtcPrice();

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-muted rounded w-24 mb-1" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
    );
  }

  if (error || !price) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground text-sm', className)}>
        <WifiOff className="w-4 h-4" />
        <span>Indisponível</span>
      </div>
    );
  }

  const isPositive = price.change_24h >= 0;
  const changeClass = isPositive ? 'text-green-400' : 'text-red-400';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  if (compact) {
    return (
      <div className={cn('space-y-0.5', className)}>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-xs font-mono text-muted-foreground">BTC</span>
        </div>
        <div className="font-mono font-bold text-foreground text-sm">
          {formatCurrency(price.usd)}
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-medium', changeClass)}>
          <TrendIcon className="w-3 h-3" />
          {isPositive ? '+' : ''}{price.change_24h.toFixed(2)}%
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-orange-400 text-xs font-bold">₿</span>
          </div>
          <span className="font-semibold text-sm">Bitcoin</span>
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-medium', changeClass)}>
          <TrendIcon className="w-4 h-4" />
          {isPositive ? '+' : ''}{price.change_24h.toFixed(2)}%
        </div>
      </div>
      <div className="font-mono font-bold text-2xl text-foreground">
        {formatCurrency(price.usd)}
      </div>
      <div className="text-sm text-muted-foreground font-mono">
        {formatCurrencyBRL(price.brl)}
      </div>
    </div>
  );
}
