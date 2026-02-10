import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCard } from '@/components/NewsCard';
import { NewsCardSkeleton } from '@/components/LoadingSpinner';
import { TagBadge } from '@/components/TagBadge';
import { newsApi } from '@/lib/api';
import { News as NewsType, NewsResponse } from '@/types';
import { cn } from '@/lib/utils';

const ALL_TAGS = [
  'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulação', 'Startup',
  'Funding', 'Web3', 'Layer2', 'Stablecoin', 'Exchange', 'Mining',
  'GameFi', 'AI', 'Macro',
];

type SourceFilter = 'all' | 'rss' | 'newsletter';

export function News() {
  const [news, setNews] = useState<NewsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sourceType, setSourceType] = useState<SourceFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNews = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const params: Record<string, string | number> = {
          page: pageNum,
          limit: 12,
        };
        if (sourceType !== 'all') params.source_type = sourceType;
        if (selectedTag) params.tag = selectedTag;
        if (debouncedSearch) params.search = debouncedSearch;

        const data: NewsResponse = await newsApi.getAll(params);

        if (append) {
          setNews((prev) => [...prev, ...data.data]);
        } else {
          setNews(data.data);
        }
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error('Failed to fetch news:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sourceType, selectedTag, debouncedSearch]
  );

  useEffect(() => {
    setPage(1);
    fetchNews(1, false);
  }, [fetchNews]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, true);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSourceType('all');
    setSelectedTag(null);
  };

  const hasFilters = search || sourceType !== 'all' || selectedTag;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Notícias</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agregador de notícias RSS e newsletters sobre cripto e startups
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notícias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Source Type Filter */}
          <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              <SelectItem value="rss">RSS Feeds</SelectItem>
              <SelectItem value="newsletter">Newsletters</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              onClick={handleTagClick}
              className={cn(
                'cursor-pointer transition-opacity',
                selectedTag && selectedTag !== tag && 'opacity-40'
              )}
            />
          ))}
        </div>

        {selectedTag && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtrando por:</span>
            <TagBadge tag={selectedTag} />
            <button
              onClick={() => setSelectedTag(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Nenhuma notícia encontrada</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou aguarde novas atualizações</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item) => (
              <NewsCard key={item.id} news={item} onTagClick={handleTagClick} />
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-w-40"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
