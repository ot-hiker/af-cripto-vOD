import { cn, TAG_COLORS } from '@/lib/utils';

interface TagBadgeProps {
  tag: string;
  className?: string;
  onClick?: (tag: string) => void;
}

export function TagBadge({ tag, className, onClick }: TagBadgeProps) {
  const colorClass = TAG_COLORS[tag] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium cursor-default',
        colorClass,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick ? () => onClick(tag) : undefined}
    >
      {tag}
    </span>
  );
}
