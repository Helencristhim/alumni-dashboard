import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/companies - Listar empresas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { razaoSocial: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
      include: {
        _count: { select: { contracts: true } },
      },
    });

    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar empresas' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Criar empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const company = await prisma.company.create({
      data: {
        razaoSocial: body.razaoSocial,
        cnpj: body.cnpj,
        endereco: body.endereco,
        cidade: body.cidade,
        estado: body.estado,
        cep: body.cep,
        representanteNome: body.representanteNome,
        representanteCpf: body.representanteCpf,
        representanteEmail: body.representanteEmail,
        representanteTelefone: body.representanteTelefone,
      },
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar empresa' },
      { status: 500 }
    );
  }
}
