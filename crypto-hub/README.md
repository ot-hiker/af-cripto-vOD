# CryptoHub — Dashboard de Cripto & Startups

Dashboard fullstack com notícias agregadas de RSS e newsletters, cotação BTC em tempo real, chat com IA e alertas de preço por email.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **AI**: Google Gemini 2.0 Flash (principal) + OpenAI GPT-4o-mini (fallback)
- **Email**: Resend
- **Deploy**: Railway

## Funcionalidades

- **Agregador de notícias**: RSS feeds + newsletters via Google Sheets/Gmail
- **IA integrada**: classificação automática de tags, resumo diário, chat contextual
- **Cotação BTC**: preço em tempo real (USD/BRL), histórico de sparkline
- **Alertas de preço**: alertas por email quando BTC atingir preço-alvo
- **Design dark**: tema terminal/fintech com sidebar responsiva

---

## Setup Local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- (Opcional) Conta no Google Cloud para newsletters

### 1. Clone e instale dependências

```bash
git clone <repo>
cd crypto-hub

# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example server/.env
# Edite server/.env com suas credenciais
```

### 3. Configure o banco de dados

O schema é criado automaticamente na inicialização do servidor. Apenas certifique-se que o `DATABASE_URL` está correto.

### 4. Inicie o servidor de desenvolvimento

```bash
# Terminal 1 — Backend (porta 3001)
cd server && npm run dev

# Terminal 2 — Frontend (porta 5173)
cd client && npm run dev
```

O frontend faz proxy automático de `/api/*` para o backend.

---

## Configuração das APIs

### Google Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie uma nova API key
3. Configure `GEMINI_API_KEY` no `.env`

### OpenAI (fallback)

1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crie uma nova API key
3. Configure `OPENAI_API_KEY` no `.env`

### Resend (alertas por email)

1. Crie conta em [Resend](https://resend.com)
2. Adicione e verifique seu domínio
3. Crie uma API key
4. Configure `RESEND_API_KEY` e `ALERT_FROM_EMAIL` no `.env`

---

## Configuração das Newsletters (Google Sheets + Gmail)

Esta feature usa Google Apps Script para capturar newsletters do Gmail e enviá-las para uma planilha Google Sheets, que o backend lê periodicamente.

### Parte 1: Google Apps Script

1. Acesse [script.google.com](https://script.google.com) e crie um novo projeto
2. Cole o conteúdo de `scripts/gmail-appscript.js`
3. Configure as constantes no topo do arquivo:
   - `GMAIL_LABEL`: nome do label do Gmail para newsletters (padrão: `crypto-news`)
   - `SPREADSHEET_ID`: ID da planilha Google Sheets (veja passo 2)
4. Execute a função `setupTrigger()` uma vez para ativar a automação
5. Autorize as permissões quando solicitado

### Parte 2: Google Sheets

1. Crie uma nova planilha em [Google Sheets](https://sheets.google.com)
2. Renomeie a aba para `Sheet1`
3. O script criará os headers automaticamente
4. Copie o ID da planilha (entre `/d/` e `/edit` na URL)
5. Configure `GOOGLE_SHEETS_ID` no `.env`

### Parte 3: Service Account (Backend)

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Ative a API "Google Sheets API"
4. Crie uma Service Account em "IAM & Admin > Service Accounts"
5. Baixe a chave JSON da Service Account
6. Configure no `.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=sua-service-account@projeto.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
7. Compartilhe a planilha com o email da Service Account (permissão de Editor)

### Parte 4: Filtros no Gmail

Configure filtros no Gmail para mover newsletters para o label `crypto-news`:
1. Abra Gmail > Configurações > Filtros e endereços bloqueados
2. Crie filtros por remetente/assunto das newsletters que você assina
3. Ação: Adicionar label "crypto-news"

---

## Deploy no Railway

### Pré-requisitos

- Conta no [Railway](https://railway.app)
- PostgreSQL provisionado no Railway

### Passos

1. **Fork ou importe** o repositório no Railway

2. **Adicione um banco PostgreSQL**:
   - No projeto Railway, clique em "Add Service" > "Database" > "PostgreSQL"
   - O `DATABASE_URL` será injetado automaticamente

3. **Configure as variáveis de ambiente** no painel Railway:
   ```
   GEMINI_API_KEY=...
   OPENAI_API_KEY=...
   RESEND_API_KEY=...
   ALERT_FROM_EMAIL=...
   RSS_FEEDS=...
   GOOGLE_SHEETS_ID=...
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...
   NODE_ENV=production
   APP_URL=https://seu-app.railway.app
   ```

4. **Deploy**: O Railway usará o `railway.toml` para fazer o build e start automaticamente

O processo de build:
1. Instala dependências do cliente
2. Faz build do React (Vite) → `client/dist`
3. Copia `client/dist` para `server/public`
4. Compila o TypeScript do servidor
5. Inicia com `node dist/index.js`

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 1234.5,
  "db": "connected",
  "lastNewsFetch": "2024-01-15T08:30:00.000Z"
}
```

---

## API Reference

### Notícias

```
GET /api/news
  ?page=1&limit=20&source_type=rss&tag=Bitcoin&search=defi

GET /api/news/:id
```

### Preço BTC

```
GET /api/price/btc
GET /api/price/btc/history?period=24h  # 1h | 24h | 7d
```

### Alertas

```
POST /api/alerts
  { "email": "...", "target_price": 100000, "direction": "above" }

GET /api/alerts?email=...

DELETE /api/alerts/:id
```

### IA

```
POST /api/ai/chat
  { "message": "O que aconteceu hoje no mercado?" }

GET /api/ai/summary          # ?date=2024-01-15
GET /api/ai/summary/latest
POST /api/ai/summary/generate
```

---

## Cron Jobs

| Job | Frequência | Descrição |
|-----|-----------|-----------|
| RSS fetch | A cada 30min | Busca novos artigos dos feeds RSS |
| Classificação IA | Após RSS fetch | Classifica notícias sem tags |
| Sheets fetch | A cada 1h | Importa newsletters do Google Sheets |
| Price history | A cada 5min | Salva histórico de preço BTC |
| Alert check | A cada 1min | Verifica e dispara alertas |
| Daily summary | 08:00 UTC | Gera resumo diário com IA |

---

## Estrutura do Projeto

```
crypto-hub/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Dashboard, News, Chat, Alerts
│   │   ├── hooks/           # useBtcPrice
│   │   ├── lib/             # utils, api client
│   │   └── types/           # TypeScript types
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/          # news, price, alerts, ai
│   │   ├── services/        # rss, sheets, ai, price, alert, email
│   │   ├── cron/            # fetchNews (todos os cron jobs)
│   │   ├── db/              # schema.sql, pool connection
│   │   └── index.ts         # Boot sequence
│   └── package.json
├── scripts/
│   └── gmail-appscript.js   # Google Apps Script para Gmail
├── .env.example
├── railway.toml
└── README.md
```
