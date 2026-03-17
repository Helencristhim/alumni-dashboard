import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateContractNumber } from '@/lib/contracts/templates';

// POST /api/contracts/[id]/duplicate - Duplicar contrato
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const original = await prisma.contract.findUnique({
      where: { id },
      include: { programs: true },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const number = generateContractNumber();

    const duplicate = await prisma.contract.create({
      data: {
        number,
        title: `${original.title} (cópia)`,
        type: original.type,
        status: 'DRAFT',
        brand: original.brand,
        companyId: original.companyId,
        templateId: original.templateId,
        contractData: original.contractData as object,
        htmlContent: original.htmlContent,
        valorTotal: original.valorTotal,
        formaPagamento: original.formaPagamento,
        diaEmissaoNf: original.diaEmissaoNf,
        diaVencimento: original.diaVencimento,
        dataInicio: original.dataInicio,
        dataFim: original.dataFim,
        prazoMeses: original.prazoMeses,
        currentVersion: 1,
        programs: {
          create: original.programs.map((p) => ({
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
            htmlContent: original.htmlContent,
            contractData: original.contractData as object,
            changeNote: `Duplicado do contrato ${original.number}`,
          },
        },
      },
      include: { company: true, programs: true },
    });

    return NextResponse.json({ success: true, data: duplicate }, { status: 201 });
  } catch (error) {
    console.error('Erro ao duplicar contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao duplicar contrato' },
      { status: 500 }
    );
  }
}
