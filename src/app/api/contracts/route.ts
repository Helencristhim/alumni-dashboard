import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateContractNumber } from '@/lib/contracts/templates';

// GET /api/contracts - Listar contratos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const brand = searchParams.get('brand') || '';
    const companyId = searchParams.get('companyId') || '';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } },
        { company: { razaoSocial: { contains: search, mode: 'insensitive' } } },
        { company: { cnpj: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (brand) where.brand = brand;
    if (companyId) where.companyId = companyId;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        company: true,
        programs: true,
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar contratos' },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Criar contrato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      brand,
      companyId,
      templateId,
      contractData,
      htmlContent,
      valorTotal,
      formaPagamento,
      diaEmissaoNf,
      diaVencimento,
      dataInicio,
      dataFim,
      prazoMeses,
      programs,
    } = body;

    const number = generateContractNumber();

    const contract = await prisma.contract.create({
      data: {
        number,
        title: title || `Contrato ${number}`,
        type: type || 'CORPORATIVO',
        status: 'DRAFT',
        brand: brand || 'alumni',
        companyId,
        templateId,
        contractData: contractData || {},
        htmlContent: htmlContent || '',
        valorTotal: valorTotal || 0,
        formaPagamento,
        diaEmissaoNf,
        diaVencimento,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        prazoMeses,
        currentVersion: 1,
        programs: {
          create: (programs || []).map((p: { tipoPrograma: string; quantidade: number; valorUnitario: number; valorTotal: number; descricao?: string }) => ({
            tipoPrograma: p.tipoPrograma,
            quantidade: p.quantidade,
            valorUnitario: p.valorUnitario,
            valorTotal: p.valorTotal,
            descricao: p.descricao,
          })),
        },
        versions: {
          create: {
            version: 1,
            htmlContent: htmlContent || '',
            contractData: contractData || {},
            changeNote: 'Versão inicial',
          },
        },
      },
      include: {
        company: true,
        programs: true,
        versions: true,
      },
    });

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar contrato' },
      { status: 500 }
    );
  }
}
