import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { parseWebhookEvent, ZapSignWebhookPayload } from '@/lib/contracts/zapsign';

// POST /api/webhooks/zapsign - Webhook do ZapSign
export async function POST(request: NextRequest) {
  try {
    const body: ZapSignWebhookPayload = await request.json();
    const event = parseWebhookEvent(body);

    console.log(`[ZapSign Webhook] Evento: ${event.eventType}, Doc: ${event.docToken}`);

    // Buscar contrato pelo token do ZapSign
    const contract = await prisma.contract.findFirst({
      where: { zapsignDocId: event.docToken },
      include: { signatories: true },
    });

    if (!contract) {
      console.log('[ZapSign Webhook] Contrato não encontrado para token:', event.docToken);
      return NextResponse.json({ received: true, matched: false });
    }

    // Atualizar status de cada signatário
    for (const signer of event.signers) {
      const dbSignatory = contract.signatories.find(
        (s) => s.zapsignSignerId === signer.token
      );

      if (!dbSignatory) continue;

      const newStatus =
        signer.status === 'signed'
          ? 'signed'
          : signer.status === 'refused'
            ? 'refused'
            : 'pending';

      await prisma.contractSignatory.update({
        where: { id: dbSignatory.id },
        data: {
          status: newStatus,
          signedAt: newStatus === 'signed' ? new Date() : null,
          signUrl: signer.sign_url || dbSignatory.signUrl,
        },
      });
    }

    // Atualizar status do contrato
    if (event.allSigned) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: 'SIGNED',
          zapsignStatus: 'signed',
          signedAt: new Date(),
        },
      });
      console.log(`[ZapSign Webhook] Contrato ${contract.number} ASSINADO por todos`);
    } else if (event.hasRefused) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          zapsignStatus: 'refused',
        },
      });
      console.log(`[ZapSign Webhook] Contrato ${contract.number} teve recusa`);
    } else {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          zapsignStatus: event.status,
        },
      });
    }

    return NextResponse.json({ received: true, matched: true });
  } catch (error) {
    console.error('[ZapSign Webhook] Erro:', error);
    return NextResponse.json(
      { received: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
