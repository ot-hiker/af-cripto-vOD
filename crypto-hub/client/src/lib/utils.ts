import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return formatCurrency(value);
}

export function formatRelativeTime(date: string | null): string {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return then.toLocaleDateString('pt-BR');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.slice(0, 2) + '***' + local.slice(-1);
  return `${masked}@${domain}`;
}

export const TAG_COLORS: Record<string, string> = {
  Bitcoin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Ethereum: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DeFi: 'bg-green-500/20 text-green-400 border-green-500/30',
  NFT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Regulação: 'bg-red-500/20 text-red-400 border-red-500/30',
  Startup: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Funding: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Web3: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Layer2: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  Stablecoin: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Exchange: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Mining: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  GameFi: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  AI: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  Macro: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};
