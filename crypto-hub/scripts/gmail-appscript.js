/**
 * CryptoHub — Google Apps Script para processar newsletters do Gmail
 *
 * COMO INSTALAR:
 * 1. Acesse https://script.google.com e crie um novo projeto
 * 2. Cole todo este código no editor
 * 3. Configure as constantes abaixo (GMAIL_LABEL e SPREADSHEET_ID)
 * 4. Execute a função setupTrigger() UMA vez para criar o trigger automático
 * 5. Autorize as permissões quando solicitado
 *
 * COMO CONFIGURAR NO GMAIL:
 * 1. Crie um label chamado "crypto-news" no Gmail
 * 2. Configure filtros para mover newsletters de cripto para este label
 *    Exemplo: De: newsletter@cointelegraph.com → Adicionar label "crypto-news"
 *
 * COMO CONFIGURAR NO GOOGLE SHEETS:
 * 1. Crie uma nova planilha Google
 * 2. Renomeie a primeira aba para "Sheet1"
 * 3. Na primeira linha, adicione os headers: Date | From | Subject | Body | Processed
 * 4. Copie o ID da planilha da URL (entre /d/ e /edit)
 * 5. Cole no SPREADSHEET_ID abaixo
 * 6. Compartilhe a planilha com a Service Account email do backend
 */

// ============================================================
// CONFIGURAÇÃO — edite aqui
// ============================================================
const GMAIL_LABEL = 'crypto-news';           // Label para buscar emails não processados
const PROCESSED_LABEL = 'crypto-news-processed';  // Label para marcar emails processados
const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI';  // ID da planilha Google Sheets
const SHEET_NAME = 'Sheet1';                 // Nome da aba na planilha
const MAX_EMAILS_PER_RUN = 20;              // Máximo de emails por execução
// ============================================================

/**
 * Função principal — processa emails novos do label configurado
 * Executada automaticamente a cada 1 hora pelo trigger
 */
function processNewsletterEmails() {
  try {
    // Garante que os labels existem
    ensureLabelsExist();

    const label = GmailApp.getUserLabelByName(GMAIL_LABEL);
    if (!label) {
      Logger.log('Label não encontrado: ' + GMAIL_LABEL);
      return;
    }

    const processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log('Sheet não encontrada: ' + SHEET_NAME);
      return;
    }

    // Garante que o cabeçalho existe
    ensureHeaders(sheet);

    // Busca threads não processadas
    const threads = label.getThreads(0, MAX_EMAILS_PER_RUN);
    let processedCount = 0;

    for (const thread of threads) {
      const messages = thread.getMessages();

      for (const message of messages) {
        try {
          // Extrai dados do email
          const date = message.getDate();
          const from = message.getFrom();
          const subject = message.getSubject();

          // Extrai corpo em texto puro
          let body = message.getPlainBody();
          if (!body || body.trim().length === 0) {
            // Fallback: strip HTML do corpo HTML
            body = stripHtml(message.getBody());
          }

          // Limita o tamanho do corpo
          body = body.trim().slice(0, 10000);

          // Insere na planilha
          sheet.appendRow([
            Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
            from,
            subject,
            body,
            'pending'  // Será atualizado para "synced" pelo backend
          ]);

          processedCount++;
        } catch (msgError) {
          Logger.log('Erro ao processar mensagem: ' + msgError.toString());
        }
      }

      // Move thread para o label de processados
      thread.removeLabel(label);
      if (processedLabel) {
        thread.addLabel(processedLabel);
      }
    }

    Logger.log('Emails processados: ' + processedCount);
  } catch (error) {
    Logger.log('Erro na execução principal: ' + error.toString());
  }
}

/**
 * Remove tags HTML de uma string
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Garante que os headers da planilha existem
 */
function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, 5).getValues()[0];
  const hasHeaders = firstRow[0] === 'Date' || firstRow[0].toString().trim() !== '';

  if (!hasHeaders) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 5).setValues([['Date', 'From', 'Subject', 'Body', 'Processed']]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('Headers criados na planilha');
  }
}

/**
 * Garante que os labels do Gmail existem, criando se necessário
 */
function ensureLabelsExist() {
  const mainLabel = GmailApp.getUserLabelByName(GMAIL_LABEL);
  if (!mainLabel) {
    GmailApp.createLabel(GMAIL_LABEL);
    Logger.log('Label criado: ' + GMAIL_LABEL);
  }

  const processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!processedLabel) {
    GmailApp.createLabel(PROCESSED_LABEL);
    Logger.log('Label criado: ' + PROCESSED_LABEL);
  }
}

/**
 * Configura o trigger automático para executar a cada 1 hora
 * EXECUTE ESTA FUNÇÃO UMA VEZ para ativar a automação
 */
function setupTrigger() {
  // Remove triggers existentes para evitar duplicatas
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processNewsletterEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Cria novo trigger a cada hora
  ScriptApp.newTrigger('processNewsletterEmails')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Trigger configurado: processNewsletterEmails executará a cada hora');
}

/**
 * Remove todos os triggers (para desativar o script)
 */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
  Logger.log('Todos os triggers removidos');
}

/**
 * Função de teste — executa manualmente para verificar se está funcionando
 */
function testProcessing() {
  Logger.log('Iniciando teste de processamento...');
  processNewsletterEmails();
  Logger.log('Teste concluído. Verifique a planilha: ' + SPREADSHEET_ID);
}
