import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Templates B2C padrao caso nao existam no banco
const DEFAULT_TEMPLATES = [
  {
    type: 'PRIVATE',
    name: 'Contrato Aulas Particulares',
    description: 'Contrato individual para aulas particulares de idiomas',
  },
  {
    type: 'COMMUNITY',
    name: 'Contrato Community',
    description: 'Contrato para programa Community (aulas em grupo) com faturamento hibrido',
  },
  {
    type: 'COMMUNITY_FLOW',
    name: 'Contrato Community Flow',
    description: 'Contrato para programa Community Flow (grupo + individual) com faturamento hibrido',
  },
];

// GET /api/b2c-contracts/templates - Listar templates B2C disponiveis
export async function GET() {
  try {
    // Buscar templates do banco
    const templates = await prisma.b2CContractTemplate.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' },
    });

    // Se existem templates no banco, retornar eles
    if (templates.length > 0) {
      return NextResponse.json({ success: true, data: templates });
    }

    // Caso contrario, retornar defaults sem htmlContent
    return NextResponse.json({
      success: true,
      data: DEFAULT_TEMPLATES.map((t) => ({
        id: null,
        ...t,
        brand: 'alumni',
        htmlContent: '',
        variables: null,
        isActive: true,
      })),
    });
  } catch (error) {
    console.error('Erro ao listar templates B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar templates B2C' },
      { status: 500 }
    );
  }
}
