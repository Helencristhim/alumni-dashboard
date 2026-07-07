import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { validarSaudeControle } from '@/lib/b2b/health';

// Rotina diaria (11h Brasilia) que envia por e-mail os alertas do Controle B2B:
// Notas Fiscais em atraso, Pagamentos em atraso e NFs a emitir. So envia quando
// existe pelo menos um alerta. Segue o mesmo padrao do send-vendas-report.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_USER = process.env.GMAIL_USER || 'helen.mendes@betteredu.com.br';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';
// Destinatarios dos alertas B2B (env tem prioridade; default fixo abaixo).
const ALERTAS_TO =
  process.env.B2B_ALERTAS_TO ||
  'gilberto.lucheti@alumnibybetter.com.br, leonardo.nunes@betteredu.com.br, nfe@betteredu.com.br, carlos.m@betteredu.com.br';
const ALERTAS_CC = process.env.B2B_ALERTAS_CC || 'helen.mendes@betteredu.com.br';

const AZUL = '#003080';
const VERMELHO = '#d70c0c';
const AMBAR = '#d97706';

interface AlertaNf {
  empresa: string;
  marca: string | null;
  tipo: 'atrasado' | 'hoje' | 'proximo';
  diaEmissao: number;
  diasAtraso: number;
}
interface AlertaPagamento {
  empresa: string;
  marca: string | null;
  qtdParcelas: number;
  valorAtrasado: number;
  diasAtraso: number;
}

function autorizado(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  return request.nextUrl.searchParams.get('secret') === secret;
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function marcaTag(marca: string | null): string {
  if (!marca) return '';
  const cor = marca === 'ALUMNI BY BETTER' ? AZUL : VERMELHO;
  return `<span style="display:inline-block;font-size:10px;font-weight:700;color:#fff;background:${cor};border-radius:9px;padding:1px 7px;margin-left:6px;">${marca}</span>`;
}

function linhaAlerta(esquerda: string, meio: string, direita: string, cor: string): string {
  return `
    <tr>
      <td style="padding:9px 12px;border-bottom:1px solid #f1f1f1;border-left:3px solid ${cor};">
        <span style="color:#111827;font-weight:600;font-size:13px;">${esquerda}</span>
      </td>
      <td style="padding:9px 12px;border-bottom:1px solid #f1f1f1;color:#6b7280;font-size:12px;">${meio}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #f1f1f1;text-align:right;">
        <span style="font-size:11px;font-weight:700;color:${cor};background:${cor}1a;border-radius:9px;padding:2px 8px;">${direita}</span>
      </td>
    </tr>`;
}

function secao(titulo: string, subtitulo: string, cor: string, linhas: string): string {
  return `
    <div style="margin-top:18px;">
      <div style="font-size:14px;font-weight:800;color:${cor};">${titulo}</div>
      <div style="font-size:11px;color:#9ca3af;margin:2px 0 8px;">${subtitulo}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;">
        ${linhas}
      </table>
    </div>`;
}

function montarHtml(params: {
  dataBR: string;
  origin: string;
  nfAtrasadas: AlertaNf[];
  nfProximas: AlertaNf[];
  pagamentos: AlertaPagamento[];
}): string {
  const { dataBR, origin, nfAtrasadas, nfProximas, pagamentos } = params;

  const secNfAtraso = nfAtrasadas.length
    ? secao(
        `${nfAtrasadas.length} Nota(s) Fiscal(is) em atraso`,
        'nenhum registro neste mês após o dia de emissão',
        VERMELHO,
        nfAtrasadas
          .map((a) =>
            linhaAlerta(
              `${a.empresa}${marcaTag(a.marca)}`,
              `emitir dia ${a.diaEmissao}`,
              `${a.diasAtraso} dia(s) em atraso`,
              VERMELHO
            )
          )
          .join('')
      )
    : '';

  const secPagamento = pagamentos.length
    ? secao(
        `${pagamentos.length} Pagamento(s) em atraso`,
        'nota emitida e sem recebimento após o dia de pagamento',
        VERMELHO,
        pagamentos
          .map((a) =>
            linhaAlerta(
              `${a.empresa}${marcaTag(a.marca)}`,
              `${a.qtdParcelas} nota(s) · ${brl(a.valorAtrasado)}`,
              `${a.diasAtraso} dia(s) em atraso`,
              VERMELHO
            )
          )
          .join('')
      )
    : '';

  const secNfProxima = nfProximas.length
    ? secao(
        `${nfProximas.length} Nota(s) Fiscal(is) a emitir`,
        'lembrete antes do prazo de emissão',
        AMBAR,
        nfProximas
          .map((a) =>
            linhaAlerta(
              `${a.empresa}${marcaTag(a.marca)}`,
              `emitir dia ${a.diaEmissao}`,
              a.tipo === 'hoje' ? 'emitir hoje' : `emitir em ${Math.abs(a.diasAtraso)} dia(s)`,
              AMBAR
            )
          )
          .join('')
      )
    : '';

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;">
    <div style="max-width:680px;margin:0 auto;">
      <div style="background:${AZUL};border-radius:12px 12px 0 0;padding:20px 24px;">
        <div style="color:#fff;font-size:18px;font-weight:800;">Alumni · Controle B2B</div>
        <div style="color:#cdd8ee;font-size:13px;margin-top:2px;">Alertas do dia · ${dataBR}</div>
      </div>
      <div style="background:#fff;border:1px solid #eef0f3;border-top:0;border-radius:0 0 12px 12px;padding:20px 18px;">
        ${secNfAtraso}
        ${secPagamento}
        ${secNfProxima}
        <div style="margin-top:20px;text-align:center;">
          <a href="${origin}/controle-b2b"
             style="display:inline-block;background:${AZUL};color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">
            Abrir Controle B2B
          </a>
        </div>
        <div style="margin-top:14px;color:#9ca3af;font-size:11px;text-align:center;">
          Enviado automaticamente às 11h pelo Dashboard Alumni · ${dataBR}
        </div>
      </div>
    </div>
  </div>`;
}

async function handler(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!GMAIL_PASS) {
    return NextResponse.json({ success: false, error: 'GMAIL_APP_PASSWORD não configurado.' }, { status: 500 });
  }

  const soParaMim = request.nextUrl.searchParams.get('to') === 'me';
  const forcar = request.nextUrl.searchParams.get('force') === '1'; // envia mesmo sem alertas (teste)
  const to = soParaMim ? GMAIL_USER : ALERTAS_TO;
  const cc = soParaMim ? undefined : ALERTAS_CC || undefined;
  const dataBR = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  try {
    const origin = request.nextUrl.origin;
    const resp = await fetch(`${origin}/api/data/controle-b2b?_t=${Date.now()}`, { cache: 'no-store' });
    const dados = await resp.json();
    if (!dados?.success) throw new Error(dados?.error || 'Não foi possível obter os dados do Controle B2B.');

    // Blindagem: se os dados estiverem quebrados, NAO envia info errada.
    // Avisa a Helen da falha e aborta o envio normal.
    const saude = validarSaudeControle(dados.data);
    if (!saude.ok) {
      const aviso = `Os alertas das 11h NAO foram enviados porque o Controle B2B esta com problema:\n- ${saude.problemas.join('\n- ')}`;
      const tErro = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      });
      await tErro.sendMail({
        from: GMAIL_USER,
        to: GMAIL_USER,
        subject: `[QUEBROU] Controle B2B - alertas das 11h nao enviados - ${dataBR}`,
        text: aviso,
      });
      return NextResponse.json({ success: false, enviado: false, motivo: 'dados_quebrados', problemas: saude.problemas });
    }

    const todosNf: AlertaNf[] = dados.data.alertasNf || [];
    const nfAtrasadas = todosNf.filter((a) => a.tipo === 'atrasado');
    const nfProximas = todosNf.filter((a) => a.tipo !== 'atrasado');
    const pagamentos: AlertaPagamento[] = dados.data.alertasPagamento || [];

    const totalAlertas = nfAtrasadas.length + nfProximas.length + pagamentos.length;
    if (totalAlertas === 0 && !forcar) {
      return NextResponse.json({ success: true, enviado: false, motivo: 'Sem alertas hoje', data: dataBR });
    }

    const html = montarHtml({ dataBR, origin, nfAtrasadas, nfProximas, pagamentos });
    const partes: string[] = [];
    if (nfAtrasadas.length) partes.push(`${nfAtrasadas.length} NF em atraso`);
    if (pagamentos.length) partes.push(`${pagamentos.length} pagamento(s) em atraso`);
    if (nfProximas.length) partes.push(`${nfProximas.length} NF a emitir`);
    const assunto = `[Controle B2B] ${partes.join(' · ') || 'Sem alertas'} - ${dataBR}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const info = await transporter.sendMail({
      from: GMAIL_USER,
      to,
      cc,
      subject: assunto,
      text: `Alertas do Controle B2B em ${dataBR}: ${partes.join(' · ') || 'sem alertas'}. Abra o painel: ${origin}/controle-b2b`,
      html,
    });

    return NextResponse.json({
      success: true,
      enviado: true,
      enviadoPara: { to, cc },
      aceitos: info.accepted,
      resumo: { nfAtrasadas: nfAtrasadas.length, pagamentos: pagamentos.length, nfProximas: nfProximas.length },
      data: dataBR,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar os alertas B2B.';
    console.error('Erro send-b2b-alertas:', message);
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      });
      await transporter.sendMail({
        from: GMAIL_USER,
        to: GMAIL_USER,
        subject: `[ALERTA] Falha no envio dos alertas B2B - ${dataBR}`,
        text: `O envio automático dos alertas B2B falhou em ${dataBR}. Erro: ${message}`,
      });
    } catch {
      // registra no log se nem o aviso sair
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}
export async function POST(request: NextRequest) {
  return handler(request);
}
