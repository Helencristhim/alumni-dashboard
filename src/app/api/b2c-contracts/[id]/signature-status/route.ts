import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getDocumentStatus } from '@/lib/contracts/zapsign';

// GET /api/b2c-contracts/[id]/signature-status - Consultar status de assinatura
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.b2CContract.findUnique({
      where: { id },
      include: { signatories: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      );
    }

    if (!contract.zapsignDocId) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao foi enviado para assinatura' },
        { status: 400 }
      );
    }

    // Consultar ZapSign
    const docStatus = await getDocumentStatus(contract.zapsignDocId);

    // Sincronizar status dos signatarios
    const updated = await prisma.$transaction(async (tx) => {
      for (const zapSigner of docStatus.signers) {
        await tx.b2CContractSignatory.updateMany({
          where: {
            contractId: id,
            zapsignSignerId: zapSigner.token,
          },
          data: {
            status: zapSigner.status,
            signedAt: zapSigner.status === 'signed' ? new Date() : undefined,
          },
        });
      }

      // Verificar se todos assinaram
      const allSigned = docStatus.signers.every((s) => s.status === 'signed');
      const hasRefused = docStatus.signers.some((s) => s.status === 'refused');

      let newStatus = contract.status;
      if (allSigned) newStatus = 'SIGNED';
      else if (hasRefused) newStatus = 'CANCELLED';

      return tx.b2CContract.update({
        where: { id },
        data: {
          zapsignStatus: docStatus.status,
          status: newStatus,
          signedAt: allSigned ? new Date() : undefined,
        },
        include: { signatories: true },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        contract: updated,
        zapsignStatus: docStatus.status,
        signatories: updated.signatories.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          status: s.status,
          signUrl: s.signUrl,
          signedAt: s.signedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao consultar status de assinatura B2C:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao consultar status de assinatura';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
