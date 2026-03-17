import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { parseWebhookEvent, ZapSignWebhookPayload } from '@/lib/contracts/zapsign';

// POST /api/webhooks/zapsign - Webhook do ZapSign
export async function POST(request: NextRequest) {
  try {
    const body: ZapSignWebhookPayload = await request.json();
    const event = parseWebhookEvent(body);

    // Buscar contrato pelo token do ZapSign
    const contract = await prisma.contract.findFirst({
      where: { zapsignDocId: event.docToken },
      include: { signatories: true },
    });

    if (!contract) {
      return NextResponse.json({ received: true, matched: false });
    }

    // Atualizar status dos signatários
    for (const signer of event.signers) {
      if (signer.status === 'signed') {
        await prisma.contractSignatory.updateMany({
          where: {
            contractId: contract.id,
            zapsignSignerId: signer.token,
          },
          data: { signedAt: new Date() },
        });
      }
    }

    // Se todos assinaram, atualizar contrato
    if (event.allSigned) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: 'SIGNED',
          zapsignStatus: 'signed',
          signedAt: new Date(),
        },
      });
    } else {
      // Atualizar status geral
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          zapsignStatus: event.status,
        },
      });
    }

    return NextResponse.json({ received: true, matched: true });
  } catch (error) {
    console.error('Erro no webhook ZapSign:', error);
    return NextResponse.json(
      { received: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
