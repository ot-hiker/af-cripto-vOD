import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import pool from '../db/index';

const VALID_TAGS = [
  'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Regulação', 'Startup',
  'Funding', 'Web3', 'Layer2', 'Stablecoin', 'Exchange', 'Mining',
  'GameFi', 'AI', 'Macro',
];

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.error(`[AI] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await callWithRetry(() => model.generateContent(prompt));
  return result.response.text();
}

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey });
  const response = await callWithRetry(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })
  );

  return response.choices[0]?.message?.content || '';
}

async function callAI(prompt: string): Promise<{ text: string; model: string }> {
  try {
    const text = await callGemini(prompt);
    return { text, model: 'gemini' };
  } catch (err) {
    console.error(`[AI] Gemini failed: ${(err as Error).message}, trying OpenAI fallback`);
    try {
      const text = await callOpenAI(prompt);
      return { text, model: 'gpt' };
    } catch (fallbackErr) {
      throw new Error(`Both AI providers failed: ${(fallbackErr as Error).message}`);
    }
  }
}

export async function summarizeNewsletter(subject: string, body: string): Promise<string> {
  const truncatedBody = body.slice(0, 3000);
  const prompt = `Resuma esta newsletter em 2-3 frases claras e informativas em português do Brasil.
Foque nos fatos principais, números e empresas mencionadas.
Não inclua saudações, links ou formatação. Apenas texto corrido.

Assunto: ${subject}
Conteúdo:
${truncatedBody}`;

  try {
    const { text } = await callAI(prompt);
    return text.trim().slice(0, 500);
  } catch (err) {
    console.error(`[AI] Newsletter summarization failed: ${(err as Error).message}`);
    return body.replace(/https?:\/\/\S+/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, 300);
  }
}

export async function classifyNews(
  newsItems: { id: number; title: string; summary: string | null }[]
): Promise<void> {
  if (newsItems.length === 0) return;

  const batch = newsItems.slice(0, 20);
  const newsJson = batch.map((n) => ({ id: n.id, title: n.title, summary: n.summary || '' }));

  const prompt = `Classifique cada notícia com 1-3 tags da lista: ${VALID_TAGS.join(', ')}.
Responda APENAS em JSON válido, sem markdown, sem explicações: [{"id": number, "tags": string[]}]

Notícias:
${JSON.stringify(newsJson)}`;

  try {
    const { text } = await callAI(prompt);
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const classifications = JSON.parse(cleaned) as { id: number; tags: string[] }[];

    for (const classification of classifications) {
      const validTags = classification.tags.filter((tag) => VALID_TAGS.includes(tag));
      await pool.query('UPDATE news SET tags = $1 WHERE id = $2', [validTags, classification.id]);
    }

    console.log(`[AI] Classified ${batch.length} news items`);
  } catch (err) {
    console.error(`[AI] Classification failed: ${(err as Error).message}`);
  }
}

export async function generateDailySummary(): Promise<string> {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const result = await pool.query(
    `SELECT title, summary, source_name, source_type, published_at FROM news
     WHERE published_at >= $1
     ORDER BY published_at DESC
     LIMIT 50`,
    [yesterday]
  );

  const news = result.rows;
  if (news.length === 0) {
    return 'Nenhuma notícia disponível para o resumo de hoje.';
  }

  const now = new Date();
  const brDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const todayStr = brDate.toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const newsText = news
    .map((n, i) => `${i + 1}. [${n.source_name}] ${n.title}: ${n.summary || ''}`)
    .join('\n');

  const prompt = `Você é um analista de cripto e startups. A data de HOJE é ${todayStr}. Analise as seguintes ${news.length} notícias das últimas 24h e gere um resumo executivo em português do Brasil.

Estruture em seções:
1) **Destaques do Dia** (3-5 pontos principais)
2) **Movimentos de Mercado**
3) **Startups e Funding**
4) **O que ficar de olho**

Use markdown. Seja conciso mas informativo.
Ao mencionar datas, use a data correta de hoje: ${todayStr}.

Notícias:
${newsText}`;

  try {
    const { text, model } = await callAI(prompt);

    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO daily_summaries (summary_date, content, model_used, news_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (summary_date) DO UPDATE SET content = $2, model_used = $3, news_count = $4, created_at = NOW()`,
      [today, text, model, news.length]
    );

    console.log(`[AI] Daily summary generated using ${model} for ${news.length} news items`);
    return text;
  } catch (err) {
    console.error(`[AI] Daily summary failed: ${(err as Error).message}`);
    throw err;
  }
}

export async function chatWithContext(
  message: string
): Promise<{ reply: string; sources: { id: number; title: string; url: string | null }[] }> {
  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });

  // Search for relevant news using keyword matching
  const keywords = message
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  let newsRows;
  if (keywords.length > 0) {
    const searchPattern = `%${keywords[0]}%`;
    const result = await pool.query(
      `SELECT id, title, summary, url FROM news
       WHERE LOWER(title) ILIKE $1 OR LOWER(summary) ILIKE $1
       ORDER BY published_at DESC
       LIMIT 30`,
      [searchPattern]
    );
    newsRows = result.rows;

    // If not enough results, pad with latest news
    if (newsRows.length < 10) {
      const latestResult = await pool.query(
        `SELECT id, title, summary, url FROM news
         ORDER BY published_at DESC
         LIMIT 30`
      );
      const existingIds = new Set(newsRows.map((n: { id: number }) => n.id));
      const additional = latestResult.rows.filter((n: { id: number }) => !existingIds.has(n.id));
      newsRows = [...newsRows, ...additional].slice(0, 30);
    }
  } else {
    const result = await pool.query(
      `SELECT id, title, summary, url FROM news
       ORDER BY published_at DESC
       LIMIT 30`
    );
    newsRows = result.rows;
  }

  const newsContext = newsRows
    .map((n: { id: number; title: string; summary: string | null }, i: number) =>
      `[${n.id}] ${n.title}: ${n.summary || ''}`
    )
    .join('\n');

  const prompt = `A data de hoje é ${todayStr}. Baseado nas seguintes notícias recentes, responda a pergunta do usuário em português do Brasil.
Seja conciso e direto. Cite os IDs das notícias que você usou na resposta (formato: [ID]).

Notícias disponíveis:
${newsContext}

Pergunta: ${message}`;

  const { text: reply } = await callAI(prompt);

  // Extract cited news IDs from response
  const citedIds = new Set<number>();
  const idMatches = reply.matchAll(/\[(\d+)\]/g);
  for (const match of idMatches) {
    citedIds.add(parseInt(match[1]));
  }

  const sources = newsRows
    .filter((n: { id: number }) => citedIds.has(n.id))
    .map((n: { id: number; title: string; url: string | null }) => ({ id: n.id, title: n.title, url: n.url }));

  return { reply, sources };
}
