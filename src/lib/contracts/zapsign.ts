import { SignatoryData } from '@/types/contracts';

// ============================================================
// INTEGRAÇÃO ZAPSIGN
// ============================================================

const ZAPSIGN_API_URL = 'https://api.zapsign.com.br/api/v1';

function getApiToken(): string {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) throw new Error('ZAPSIGN_API_TOKEN não configurado');
  return token;
}

interface ZapSignDocResponse {
  open_id: number;
  token: string;
  status: string;
  name: string;
  signers: Array<{
    token: string;
    name: string;
    email: string;
    status: string;
    sign_url: string;
  }>;
}

// Criar documento para assinatura
export async function createDocument(
  name: string,
  pdfUrl: string,
  signatories: SignatoryData[]
): Promise<ZapSignDocResponse> {
  const token = getApiToken();

  const response = await fetch(`${ZAPSIGN_API_URL}/docs/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sandbox: process.env.NODE_ENV !== 'production',
      name,
      url_pdf: pdfUrl,
      lang: 'pt-br',
      signers: signatories.map((s) => ({
        name: s.name,
        email: s.email,
        auth_mode: 'assinaturaTela',
        send_automatic_email: true,
        send_automatic_whatsapp: false,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZapSign error: ${error}`);
  }

  return response.json();
}

// Consultar status do documento
export async function getDocumentStatus(docToken: string): Promise<ZapSignDocResponse> {
  const token = getApiToken();

  const response = await fetch(`${ZAPSIGN_API_URL}/docs/${docToken}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao consultar status do documento');
  }

  return response.json();
}

// Processar webhook do ZapSign
export interface ZapSignWebhookPayload {
  event_type: string;
  doc: {
    token: string;
    status: string;
    signers: Array<{
      token: string;
      status: string;
      name: string;
      email: string;
    }>;
  };
}

export function parseWebhookEvent(payload: ZapSignWebhookPayload) {
  return {
    docToken: payload.doc.token,
    status: payload.doc.status,
    signers: payload.doc.signers,
    allSigned: payload.doc.signers.every((s) => s.status === 'signed'),
  };
}
