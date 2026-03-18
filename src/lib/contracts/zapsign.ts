import { SignatoryData } from '@/types/contracts';

// ============================================================
// INTEGRAÇÃO ZAPSIGN - API REST v1
// Docs: https://docs.zapsign.com.br
// ============================================================

const ZAPSIGN_API_URL = 'https://api.zapsign.com.br/api/v1';

function getApiToken(): string {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) throw new Error('ZAPSIGN_API_TOKEN não configurado');
  return token;
}

// ============================================================
// TIPOS DE RESPOSTA
// ============================================================

export interface ZapSignSigner {
  token: string;
  name: string;
  email: string;
  status: string;
  sign_url: string;
}

export interface ZapSignDocResponse {
  open_id: number;
  token: string;
  status: string;
  name: string;
  external_id: string;
  signers: ZapSignSigner[];
  created_at: string;
}

// ============================================================
// CRIAR DOCUMENTO PARA ASSINATURA (com base64 PDF)
// ============================================================

export async function createDocumentFromBase64(
  name: string,
  base64Pdf: string,
  signatories: SignatoryData[],
  options?: {
    reminderEveryNDays?: number;
    externalId?: string;
  }
): Promise<ZapSignDocResponse> {
  const token = getApiToken();

  const response = await fetch(`${ZAPSIGN_API_URL}/docs/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sandbox: process.env.ZAPSIGN_SANDBOX !== 'false',
      name,
      base64_pdf: base64Pdf,
      lang: 'pt-br',
      disable_signer_emails: false,
      send_automatic_email: true,
      reminder_every_n_days: options?.reminderEveryNDays ?? 3,
      external_id: options?.externalId ?? '',
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
    const errorText = await response.text();
    console.error('ZapSign API error:', response.status, errorText);
    throw new Error(`ZapSign error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================================
// CONSULTAR STATUS DO DOCUMENTO
// ============================================================

export async function getDocumentStatus(docToken: string): Promise<ZapSignDocResponse> {
  const token = getApiToken();

  const response = await fetch(`${ZAPSIGN_API_URL}/docs/${docToken}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao consultar documento: ${errorText}`);
  }

  return response.json();
}

// ============================================================
// WEBHOOK - Processar eventos do ZapSign
// ============================================================

export interface ZapSignWebhookPayload {
  event_type: string;
  doc: {
    token: string;
    status: string;
    name: string;
    external_id: string;
    signers: Array<{
      token: string;
      status: string;
      name: string;
      email: string;
      sign_url: string;
    }>;
  };
}

export function parseWebhookEvent(payload: ZapSignWebhookPayload) {
  return {
    eventType: payload.event_type,
    docToken: payload.doc.token,
    status: payload.doc.status,
    externalId: payload.doc.external_id,
    signers: payload.doc.signers,
    allSigned: payload.doc.signers.every((s) => s.status === 'signed'),
    hasRefused: payload.doc.signers.some((s) => s.status === 'refused'),
  };
}
