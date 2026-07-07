import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { validarSaudeControle } from '@/lib/b2b/health';

// Monitor de saude do Controle B2B. Se a API falhar ou os dados vierem
// quebrados (empresas sumindo, nomes de cabecalho, valores zerados), avisa
// a Helen por e-mail IMEDIATAMENTE. Quando esta tudo ok, nao envia nada.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_USER = process.env.GMAIL_USER || 'helen.mendes@betteredu.com.br';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';
const HEALTH_TO = process.env.B2B_HEALTH_TO || 'helen.mendes@betteredu.com.br';
const VERMELHO = '#d70c0c';
const AZUL = '#003080';

function autorizado(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  return request.nextUrl.searchParams.get('secret') === secret;
}

async function enviarAlertaQuebra(origin: string, problemas: string[], detalhe: string) {
  if (!GMAIL_PASS) return;
  const dataBR = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const lista = problemas.map((p) => `<li style="margin-bottom:4px;">${p}</li>`).join('');
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;">
    <div style="max-width:620px;margin:0 auto;">
      <div style="background:${VERMELHO};border-radius:12px 12px 0 0;padding:18px 22px;">
        <div style="color:#fff;font-size:17px;font-weight:800;">⚠ Controle B2B com problema</div>
        <div style="color:#ffe1e1;font-size:13px;margin-top:2px;">Verificado em ${dataBR}</div>
      </div>
      <div style="background:#fff;border:1px solid #eef0f3;border-top:0;border-radius:0 0 12px 12px;padding:18px;">
        <p style="font-size:13px;color:#111827;margin:0 0 10px;">O monitor automatico detectou que o Controle B2B pode estar quebrado:</p>
        <ul style="font-size:13px;color:${VERMELHO};padding-left:18px;margin:0 0 14px;">${lista}</ul>
        ${detalhe ? `<div style="font-size:11px;color:#6b7280;background:#f9fafb;border:1px solid #f0f0f0;border-radius:8px;padding:8px 10px;">${detalhe}</div>` : ''}
        <div style="margin-top:16px;text-align:center;">
          <a href="${origin}/controle-b2b" style="display:inline-block;background:${AZUL};color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">Abrir Controle B2B</a>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin-top:14px;text-align:center;">Provavel causa: alguem mexeu na estrutura da planilha (colunas movidas/removidas). Os alertas das 11h NAO serao enviados ate normalizar.</p>
      </div>
    </div>
  </div>`;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
  await transporter.sendMail({
    from: GMAIL_USER,
    to: HEALTH_TO,
    subject: `[QUEBROU] Controle B2B com problema - ${dataBR}`,
    text: `O monitor detectou problema no Controle B2B em ${dataBR}:\n- ${problemas.join('\n- ')}\n\n${detalhe}\n\nAbra: ${origin}/controle-b2b`,
    html,
  });
}

async function handler(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const origin = request.nextUrl.origin;
  try {
    const resp = await fetch(`${origin}/api/data/controle-b2b?_t=${Date.now()}`, { cache: 'no-store' });
    const json = await resp.json().catch(() => null);

    if (!resp.ok || !json?.success) {
      const erro = json?.error || `HTTP ${resp.status}`;
      // Erro transitorio do Google (429/5xx) NAO e quebra: a planilha continua
      // publica e o proximo ciclo (15 min) deve normalizar. Nao spammar a Helen
      // com falso "QUEBROU" — so registra e segue. Quebra real (estrutura/acesso)
      // nao vem marcada como transitorio e continua disparando o alerta.
      if (json?.transitorio) {
        return NextResponse.json({ healthy: false, transitorio: true, alertado: false, erro });
      }
      await enviarAlertaQuebra(origin, ['A API do Controle B2B retornou erro.'], `Erro: ${erro}`);
      return NextResponse.json({ healthy: false, alertado: true, erro });
    }

    const saude = validarSaudeControle(json.data);
    if (!saude.ok) {
      await enviarAlertaQuebra(
        origin,
        saude.problemas,
        `Lidas ${saude.resumo.empresas} empresas, ${saude.resumo.parcelas} parcelas, total ${saude.resumo.totalContratado}.`
      );
      return NextResponse.json({ healthy: false, alertado: true, ...saude });
    }

    return NextResponse.json({ healthy: true, ...saude });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido no monitor.';
    await enviarAlertaQuebra(origin, ['Falha ao executar o monitor do Controle B2B.'], message).catch(() => {});
    return NextResponse.json({ healthy: false, alertado: true, erro: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}
export async function POST(request: NextRequest) {
  return handler(request);
}
