import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/contracts/[id]/versions - Listar versões
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await prisma.contractVersion.findMany({
      where: { contractId: id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error('Erro ao listar versões:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar versões' },
      { status: 500 }
    );
  }
}
