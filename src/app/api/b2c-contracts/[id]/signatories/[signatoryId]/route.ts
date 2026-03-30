import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// PATCH /api/b2c-contracts/[id]/signatories/[signatoryId] - Atualizar email do signatário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; signatoryId: string }> }
) {
  try {
    const { id, signatoryId } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email invalido' },
        { status: 400 }
      );
    }

    // Verificar se o signatário pertence ao contrato
    const signatory = await prisma.b2CContractSignatory.findFirst({
      where: { id: signatoryId, contractId: id },
    });

    if (!signatory) {
      return NextResponse.json(
        { success: false, error: 'Signatario nao encontrado' },
        { status: 404 }
      );
    }

    if (signatory.status === 'signed') {
      return NextResponse.json(
        { success: false, error: 'Nao e possivel alterar email de signatario que ja assinou' },
        { status: 400 }
      );
    }

    const updated = await prisma.b2CContractSignatory.update({
      where: { id: signatoryId },
      data: { email },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar signatario:', error);
    const message = error instanceof Error ? error.message : 'Erro ao atualizar signatario';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
