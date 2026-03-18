import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/b2c-contracts - Listar contratos B2C
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { nomeAluno: { contains: search, mode: 'insensitive' } },
        { cpfAluno: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const contracts = await prisma.b2CContract.findMany({
      where,
      include: {
        _count: { select: { versions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Erro ao listar contratos B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar contratos B2C' },
      { status: 500 }
    );
  }
}

// POST /api/b2c-contracts - Criar contrato B2C
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      brand,
      nomeAluno,
      cpfAluno,
      emailAluno,
      telefoneAluno,
      enderecoAluno,
      valorTotal,
      formaPagamento,
      tipoCobranca,
      parcelas,
      contractData,
      htmlContent,
    } = body;

    // Gerar numero sequencial
    const count = await prisma.b2CContract.count();
    const year = new Date().getFullYear();
    const number = `B2C-${year}-${String(count + 1).padStart(4, '0')}`;

    // Auto-set faturamentoHibrido para COMMUNITY e COMMUNITY_FLOW
    const faturamentoHibrido = type === 'COMMUNITY' || type === 'COMMUNITY_FLOW';

    const contract = await prisma.b2CContract.create({
      data: {
        number,
        title: title || `Contrato ${number}`,
        type: type || 'PRIVATE',
        status: 'DRAFT',
        brand: brand || 'alumni',
        nomeAluno,
        cpfAluno,
        emailAluno,
        telefoneAluno,
        enderecoAluno,
        valorTotal: valorTotal || 0,
        formaPagamento,
        tipoCobranca,
        parcelas,
        faturamentoHibrido,
        contractData: contractData || {},
        htmlContent: htmlContent || '',
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            htmlContent: htmlContent || '',
            contractData: contractData || {},
            changeNote: 'Versao inicial',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar contrato B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar contrato B2C' },
      { status: 500 }
    );
  }
}
