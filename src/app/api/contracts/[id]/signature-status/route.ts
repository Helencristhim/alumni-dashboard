import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getDocumentStatus } from '@/lib/contracts/zapsign';

// GET /api/contracts/[id]/signature-status - Consultar status da assinatura
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { signatories: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    if (!contract.zapsignDocId) {
      return NextResponse.json({
        success: true,
        data: {
          status: contract.status,
          zapsignStatus: null,
          signatories: [],
        },
      });
    }

    // Consultar ZapSign para status atualizado
    let zapsignData = null;
    try {
      zapsignData = await getDocumentStatus(contract.zapsignDocId);

      // Atualizar status dos signatários no banco
      for (const zapSigner of zapsignData.signers) {
        const dbSignatory = contract.signatories.find(
          (s) => s.zapsignSignerId === zapSigner.token
        );

        if (dbSignatory) {
          const newStatus =
            zapSigner.status === 'signed'
              ? 'signed'
              : zapSigner.status === 'refused'
                ? 'refused'
                : 'pending';

          if (dbSignatory.status !== newStatus) {
            await prisma.contractSignatory.update({
              where: { id: dbSignatory.id },
              data: {
                status: newStatus,
                signedAt: newStatus === 'signed' ? new Date() : null,
                signUrl: zapSigner.sign_url || dbSignatory.signUrl,
              },
            });
          }
        }
      }

      // Verificar se todos assinaram
      const allSigned = zapsignData.signers.every(
        (s) => s.status === 'signed'
      );
      if (allSigned && contract.status !== 'SIGNED') {
        await prisma.contract.update({
          where: { id },
          data: {
            status: 'SIGNED',
            zapsignStatus: 'signed',
            signedAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.error('Erro ao consultar ZapSign:', err);
      // Retorna dados do banco mesmo se ZapSign falhar
    }

    // Buscar signatários atualizados
    const signatories = await prisma.contractSignatory.findMany({
      where: { contractId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        status: contract.status,
        zapsignStatus: contract.zapsignStatus,
        zapsignDocId: contract.zapsignDocId,
        signatories: signatories.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          signatoryType: s.signatoryType,
          status: s.status,
          signUrl: s.signUrl,
          signedAt: s.signedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar status' },
      { status: 500 }
    );
  }
}
