import { ExternalLink, Clock, Rss, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TagBadge } from './TagBadge';
import { formatRelativeTime } from '@/lib/utils';
import { News } from '@/types';

interface NewsCardProps {
  news: News;
  onTagClick?: (tag: string) => void;
}

export function NewsCard({ news, onTagClick }: NewsCardProps) {
  const sourceIcon = news.source_type === 'rss' ? (
    <Rss className="w-3 h-3" />
  ) : (
    <Mail className="w-3 h-3" />
  );

  const sourceBadgeClass =
    news.source_type === 'rss'
      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

  return (
    <Card className="group flex flex-col overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      {news.image_url && (
        <div className="relative h-44 overflow-hidden bg-muted">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <CardContent className="flex flex-col flex-1 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2 py-0.5 ${sourceBadgeClass}`}>
            {sourceIcon}
            {news.source_name || news.source_type}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(news.published_at)}
          </span>
        </div>

        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {news.title}
        </h3>

        {news.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{news.summary}</p>
        )}

        {news.tags && news.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {news.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} onClick={onTagClick} />
            ))}
          </div>
        )}

        {news.url && (
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium mt-auto pt-1"
          >
            Ler mais
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
