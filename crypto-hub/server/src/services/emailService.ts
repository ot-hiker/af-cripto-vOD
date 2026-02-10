import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not configured');
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendPriceAlert(
  email: string,
  targetPrice: number,
  currentPrice: number,
  direction: 'above' | 'below'
): Promise<void> {
  const fromEmail = process.env.ALERT_FROM_EMAIL || 'alerts@cryptohub.app';
  const directionText = direction === 'above' ? 'acima de' : 'abaixo de';
  const formattedCurrent = currentPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const formattedTarget = targetPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #fff; font-size: 24px; }
    .price-box { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
    .current-price { font-size: 48px; font-weight: bold; color: #f59e0b; }
    .label { font-size: 14px; color: #94a3b8; margin-top: 4px; }
    .details { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .details p { margin: 8px 0; font-size: 14px; }
    .details strong { color: #f59e0b; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
    a { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Alerta BTC Atingido!</h1>
    </div>
    <div class="price-box">
      <div class="current-price">${formattedCurrent}</div>
      <div class="label">Preço atual do Bitcoin</div>
    </div>
    <div class="details">
      <p>✅ Seu alerta foi ativado!</p>
      <p>📊 Preço-alvo: <strong>${directionText} ${formattedTarget}</strong></p>
      <p>💰 Preço atual: <strong>${formattedCurrent}</strong></p>
      <p>🕐 Horário: <strong>${timestamp} (BRT)</strong></p>
    </div>
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.APP_URL || 'https://cryptohub.app'}"
         style="background: #f59e0b; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ver Dashboard
      </a>
    </p>
    <div class="footer">
      <p>CryptoHub — Monitoramento de Criptomoedas</p>
      <p>Este alerta foi configurado por você e disparado automaticamente.</p>
    </div>
  </div>
</body>
</html>`;

  const r = getResend();
  await r.emails.send({
    from: fromEmail,
    to: email,
    subject: `🚨 Alerta BTC: Preço atingiu ${formattedCurrent}!`,
    html,
  });

  console.log(`[ALERT] Email sent to ${email} for BTC at ${formattedCurrent}`);
}
