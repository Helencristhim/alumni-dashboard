import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Roda no servidor Node (nodemailer), sempre dinâmico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_USER = process.env.GMAIL_USER || 'helen.mendes@betteredu.com.br';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';
const REPORT_TO = process.env.REPORT_TO || 'carlos.m@betteredu.com.br';
const REPORT_CC = process.env.REPORT_CC || 'helen.mendes@betteredu.com.br';

const AZUL = '#003080';
const VERMELHO = '#d70c0c';

interface Venda {
  consultor: string;
  produto: string;
  valor: number;
  renovNovo: string;
}
interface Totais {
  quantidade: number;
  valor: number;
  novos: number;
  renovacoes: number;
}

// Vercel Cron envia "Authorization: Bearer <CRON_SECRET>". Em dev liberamos.
// Para teste manual também aceitamos ?secret=<CRON_SECRET>.
function autorizado(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  const qs = request.nextUrl.searchParams.get('secret');
  return qs === secret;
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function agrupar(vendas: Venda[], chave: 'consultor' | 'produto') {
  const map: Record<string, { quantidade: number; valor: number }> = {};
  for (const v of vendas) {
    const k = v[chave] || 'Não informado';
    if (!map[k]) map[k] = { quantidade: 0, valor: 0 };
    map[k].quantidade++;
    map[k].valor += v.valor;
  }
  return Object.entries(map)
    .map(([nome, d]) => ({ nome, ...d }))
    .sort((a, b) => b.valor - a.valor);
}

function linhasTabela(rows: { nome: string; quantidade: number; valor: number }[]): string {
  if (rows.length === 0) {
    return `<tr><td colspan="3" style="padding:10px;color:#9ca3af;text-align:center;">Sem vendas</td></tr>`;
  }
  return rows
    .map(
      (r, i) => `
      <tr style="background:${i % 2 ? '#f9fafb' : '#ffffff'};">
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111827;">${r.nome}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;text-align:center;">${r.quantidade}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:${AZUL};font-weight:600;text-align:right;">${brl(r.valor)}</td>
      </tr>`
    )
    .join('');
}

function kpiCard(titulo: string, valor: string, cor: string): string {
  return `
    <td style="padding:6px;" width="25%">
      <div style="border:1px solid #eef0f3;border-radius:12px;padding:16px;background:#fff;">
        <div style="font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;font-weight:600;">${titulo}</div>
        <div style="font-size:22px;font-weight:800;color:${cor};margin-top:6px;">${valor}</div>
      </div>
    </td>`;
}

function montarHtml(params: {
  dataBR: string;
  totais: Totais;
  porConsultor: { nome: string; quantidade: number; valor: number }[];
  porProduto: { nome: string; quantidade: number; valor: number }[];
  aviso?: string;
}): string {
  const { dataBR, totais, porConsultor, porProduto, aviso } = params;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;">
    <div style="max-width:680px;margin:0 auto;">
      <div style="background:${AZUL};border-radius:12px 12px 0 0;padding:20px 24px;">
        <div style="color:#fff;font-size:18px;font-weight:800;">Alumni · Dashboard Executivo</div>
        <div style="color:#cdd8ee;font-size:13px;margin-top:2px;">Vendas do mês · ${dataBR}</div>
      </div>
      <div style="background:#fff;border:1px solid #eef0f3;border-top:0;border-radius:0 0 12px 12px;padding:20px 18px;">
        ${
          aviso
            ? `<div style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:14px;">${aviso}</div>`
            : ''
        }
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          <tr>
            ${kpiCard('Vendas no mês', String(totais.quantidade), AZUL)}
            ${kpiCard('Faturamento', brl(totais.valor), '#059669')}
            ${kpiCard('Novos', String(totais.novos), '#7c3aed')}
            ${kpiCard('Renovações', String(totais.renovacoes), '#d97706')}
          </tr>
        </table>

        <div style="font-size:14px;font-weight:700;color:#111827;margin:18px 0 6px;">Por Consultor</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;font-size:13px;">
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Consultor</th>
            <th style="padding:8px 12px;text-align:center;color:#6b7280;">Vendas</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;">Valor</th>
          </tr>
          ${linhasTabela(porConsultor)}
        </table>

        <div style="font-size:14px;font-weight:700;color:#111827;margin:18px 0 6px;">Por Produto</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;font-size:13px;">
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Produto</th>
            <th style="padding:8px 12px;text-align:center;color:#6b7280;">Vendas</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;">Valor</th>
          </tr>
          ${linhasTabela(porProduto)}
        </table>

        <div style="margin-top:18px;text-align:center;">
          <a href="https://alumni-dashboard-nine.vercel.app/vendas-hoje"
             style="display:inline-block;background:${AZUL};color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;">
            Abrir dashboard completo
          </a>
        </div>
        <div style="margin-top:14px;color:#9ca3af;font-size:11px;text-align:center;">
          Enviado automaticamente pelo Dashboard Alumni · ${dataBR}
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
    return NextResponse.json(
      { success: false, error: 'GMAIL_APP_PASSWORD não configurado.' },
      { status: 500 }
    );
  }

  // Em teste manual (?to=me) manda só para a Helen, pra não disparar ao Carlos
  const soParaMim = request.nextUrl.searchParams.get('to') === 'me';
  const to = soParaMim ? GMAIL_USER : REPORT_TO;
  const cc = soParaMim ? undefined : REPORT_CC;

  const dataBR = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  try {
    // Busca os dados de vendas do próprio dashboard (mesma fonte da página)
    const origin = request.nextUrl.origin;
    const resp = await fetch(`${origin}/api/data/vendas-hoje?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    const dados = await resp.json();
    if (!dados?.success) {
      throw new Error(dados?.error || 'Não foi possível obter os dados de vendas.');
    }

    const vendasMes: Venda[] = dados.vendasMes || [];
    const totais: Totais = dados.totais?.mes || {
      quantidade: 0,
      valor: 0,
      novos: 0,
      renovacoes: 0,
    };

    const html = montarHtml({
      dataBR,
      totais,
      porConsultor: agrupar(vendasMes, 'consultor'),
      porProduto: agrupar(vendasMes, 'produto'),
      aviso: dados.message,
    });

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
      subject: `Vendas Hoje - Dashboard Alumni - ${dataBR}`,
      text: `Resumo de vendas do mês em ${dataBR}. Vendas: ${totais.quantidade} · Faturamento: ${brl(
        totais.valor
      )} · Novos: ${totais.novos} · Renovações: ${totais.renovacoes}. Veja o painel: https://alumni-dashboard-nine.vercel.app/vendas-hoje`,
      html,
    });

    return NextResponse.json({
      success: true,
      enviadoPara: { to, cc },
      aceitos: info.accepted,
      rejeitados: info.rejected,
      totais,
      data: dataBR,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar o relatório.';
    console.error('Erro send-vendas-report:', message);
    // Não morre calado: tenta avisar a Helen do erro
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
        subject: `[ALERTA] Falha no envio automático Vendas Hoje - ${dataBR}`,
        text: `O envio automático das 19h falhou em ${dataBR}. Erro: ${message}`,
      });
    } catch {
      // se nem o alerta sair, registra no log
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
