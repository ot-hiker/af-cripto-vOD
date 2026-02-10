import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { aiApi } from '@/lib/api';
import { ChatMessage } from '@/types';

const SUGGESTED_QUESTIONS = [
  'O que aconteceu hoje no mercado de cripto?',
  'Quais startups receberam funding recentemente?',
  'Resumo da semana sobre DeFi',
  'Quais são as principais tendências em Bitcoin?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
    </div>
  );
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length < 3 || loading) return;

      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
      setLoading(true);

      try {
        const { reply, sources } = await aiApi.chat(trimmed);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply, sources },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold">Chat IA</h1>
          <p className="text-xs text-muted-foreground">Powered by Gemini 2.0 Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Como posso ajudar?</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Faça perguntas sobre criptomoedas, startups e notícias do mercado. A IA usa
                as notícias mais recentes como contexto.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[85%] space-y-3 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border border-border rounded-tl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Fontes citadas:</p>
                  {msg.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border bg-card/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre cripto e startups..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || input.trim().length < 3}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Mínimo 3 caracteres · Baseado em notícias recentes
        </p>
      </div>
    </div>
  );
}
