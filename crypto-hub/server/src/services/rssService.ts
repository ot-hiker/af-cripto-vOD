import Parser from 'rss-parser';
import pool from '../db/index';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure', ['media:thumbnail', 'mediaThumbnail']],
  },
});

interface RssItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  'media:content'?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
}

function extractImageUrl(item: RssItem): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item['media:content']?.['$']?.url) return item['media:content']['$'].url;
  if (item.mediaThumbnail?.['$']?.url) return item.mediaThumbnail['$'].url;
  return null;
}

export async function fetchAllFeeds(): Promise<number> {
  const feedUrls = (process.env.RSS_FEEDS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (feedUrls.length === 0) {
    console.log('[RSS] No feeds configured');
    return 0;
  }

  let totalInserted = 0;

  for (const feedUrl of feedUrls) {
    try {
      console.log(`[RSS] Fetching: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      const sourceName = feed.title || feedUrl;

      for (const item of feed.items as RssItem[]) {
        if (!item.title || !item.link) continue;

        const imageUrl = extractImageUrl(item);
        const summary = item.contentSnippet?.slice(0, 500) || null;
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        try {
          const result = await pool.query(
            `INSERT INTO news (title, summary, url, source_name, source_type, image_url, published_at)
             VALUES ($1, $2, $3, $4, 'rss', $5, $6)
             ON CONFLICT (url) DO NOTHING
             RETURNING id`,
            [item.title, summary, item.link, sourceName, imageUrl, publishedAt]
          );

          if (result.rowCount && result.rowCount > 0) {
            totalInserted++;
          }
        } catch (err) {
          console.error(`[RSS] Error inserting item: ${(err as Error).message}`);
        }
      }

      console.log(`[RSS] Processed feed: ${sourceName}`);
    } catch (err) {
      console.error(`[RSS] Error fetching feed ${feedUrl}: ${(err as Error).message}`);
    }
  }

  console.log(`[RSS] Total new items inserted: ${totalInserted}`);
  return totalInserted;
}
