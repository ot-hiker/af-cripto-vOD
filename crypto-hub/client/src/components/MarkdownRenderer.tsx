import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-invert prose-sm max-w-none',
        'prose-headings:text-foreground prose-headings:font-semibold',
        'prose-p:text-muted-foreground prose-p:leading-relaxed',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-li:text-muted-foreground',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-code:text-primary prose-code:bg-muted prose-code:rounded prose-code:px-1',
        'prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground',
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
