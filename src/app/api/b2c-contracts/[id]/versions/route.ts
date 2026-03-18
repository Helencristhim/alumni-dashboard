import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/b2c-contracts/[id]/versions - Listar versoes do contrato B2C
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o contrato existe
    const contract = await prisma.b2CContract.findUnique({
      where: { id },
      select: { id: true, number: true, currentVersion: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      );
    }

    const versions = await prisma.b2CContractVersion.findMany({
      where: { contractId: id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        contractId: contract.id,
        contractNumber: contract.number,
        currentVersion: contract.currentVersion,
        versions,
      },
    });
  } catch (error) {
    console.error('Erro ao listar versoes do contrato B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar versoes do contrato B2C' },
      { status: 500 }
    );
  }
}
