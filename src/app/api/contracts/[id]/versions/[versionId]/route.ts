import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// POST /api/contracts/[id]/versions/[versionId] - Restaurar versão
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id, versionId } = await params;

    // Obter versão a restaurar
    const version = await prisma.contractVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.contractId !== id) {
      return NextResponse.json(
        { success: false, error: 'Versão não encontrada' },
        { status: 404 }
      );
    }

    // Obter versão atual do contrato
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { currentVersion: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const newVersion = contract.currentVersion + 1;

    // Atualizar contrato e criar nova versão baseada na restaurada
    const updated = await prisma.$transaction(async (tx) => {
      // Criar nova versão com conteúdo da versão restaurada
      await tx.contractVersion.create({
        data: {
          contractId: id,
          version: newVersion,
          htmlContent: version.htmlContent,
          contractData: version.contractData as object,
          changeNote: `Restaurado da versão ${version.version}`,
        },
      });

      // Atualizar contrato
      return tx.contract.update({
        where: { id },
        data: {
          htmlContent: version.htmlContent,
          contractData: version.contractData as object,
          currentVersion: newVersion,
        },
        include: {
          company: true,
          programs: true,
          versions: { orderBy: { version: 'desc' } },
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao restaurar versão:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao restaurar versão' },
      { status: 500 }
    );
  }
}
