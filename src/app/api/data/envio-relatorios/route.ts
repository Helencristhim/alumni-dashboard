import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

// imapflow precisa do runtime Node (não funciona no edge) e a resposta é sempre dinâmica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_USER = process.env.GMAIL_USER || 'helen.mendes@betteredu.com.br';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';

type TipoEnvio = 'relatorio' | 'alerta' | 'teste';

interface RelatorioEnviado {
  uid: string;
  data: string; // ISO
  to: string[];
  cc: string[];
  subject: string;
  tipo: TipoEnvio;
  anexo: boolean;
}

function classificar(subject: string): TipoEnvio {
  if (/alerta|falha/i.test(subject)) return 'alerta';
  if (/teste/i.test(subject)) return 'teste';
  return 'relatorio';
}

// Percorre a árvore do bodyStructure procurando anexos
function temAnexo(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false;
  const n = node as {
    disposition?: string;
    dispositionParameters?: { filename?: string };
    parameters?: { name?: string };
    childNodes?: unknown[];
  };
  if (n.disposition === 'attachment') return true;
  if (n.dispositionParameters?.filename) return true;
  if (n.parameters?.name) return true;
  if (Array.isArray(n.childNodes)) return n.childNodes.some(temAnexo);
  return false;
}

export async function GET() {
  if (!GMAIL_PASS) {
    return NextResponse.json(
      { success: false, error: 'GMAIL_APP_PASSWORD não configurado no ambiente.' },
      { status: 500 }
    );
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    logger: false,
  });

  try {
    await client.connect();

    // Localiza a pasta de Enviados (PT "[Gmail]/E-mails enviados" ou EN "[Gmail]/Sent Mail")
    const boxes = await client.list();
    const sent =
      boxes.find((b) => b.specialUse === '\\Sent') ||
      boxes.find((b) => /sent|enviad/i.test(b.path));

    if (!sent) {
      await client.logout();
      return NextResponse.json(
        { success: false, error: 'Pasta de Enviados não encontrada na conta.' },
        { status: 500 }
      );
    }

    const items: RelatorioEnviado[] = [];
    const lock = await client.getMailboxLock(sent.path);
    try {
      // Tudo que tem "Vendas Hoje" no assunto: relatórios, alertas de falha e testes
      const uids = (await client.search(
        { header: { subject: 'Vendas Hoje' } },
        { uid: true }
      )) as number[] | false;

      if (uids && uids.length) {
        const recentes = uids.slice(-90); // últimos ~90, mais que suficiente
        for await (const msg of client.fetch(
          { uid: recentes.join(',') },
          { uid: true, envelope: true, internalDate: true, bodyStructure: true },
          { uid: true }
        )) {
          const subject = msg.envelope?.subject || '(sem assunto)';
          items.push({
            uid: String(msg.uid),
            data: msg.internalDate ? new Date(msg.internalDate).toISOString() : '',
            to: (msg.envelope?.to || []).map((a) => a.address || '').filter(Boolean),
            cc: (msg.envelope?.cc || []).map((a) => a.address || '').filter(Boolean),
            subject,
            tipo: classificar(subject),
            anexo: temAnexo(msg.bodyStructure),
          });
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    // Mais recentes primeiro
    items.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

    const relatorios = items.filter((i) => i.tipo === 'relatorio');
    const alertas = items.filter((i) => i.tipo === 'alerta');
    const ultimo = items[0] || null;

    return NextResponse.json(
      {
        success: true,
        items,
        totais: {
          total: items.length,
          relatorios: relatorios.length,
          alertas: alertas.length,
          ultimoEnvio: ultimo?.data || null,
          ultimoTipo: ultimo?.tipo || null,
          ultimoDestino: ultimo?.to || [],
        },
        lastChecked: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    try {
      await client.logout();
    } catch {
      // ignora erro ao fechar conexão
    }
    const message = error instanceof Error ? error.message : 'Erro ao consultar a caixa de e-mail.';
    console.error('Erro envio-relatorios:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
