import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/contracts/[id] - Obter contrato
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
        programs: true,
        versions: { orderBy: { version: 'desc' } },
        files: { orderBy: { createdAt: 'desc' } },
        signatories: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contract });
  } catch (error) {
    console.error('Erro ao obter contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter contrato' },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Atualizar contrato
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      type,
      status,
      brand,
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
      saveVersion,
      changeNote,
    } = body;

    // Obter contrato atual
    const current = await prisma.contract.findUnique({
      where: { id },
      select: { currentVersion: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const newVersion = saveVersion ? current.currentVersion + 1 : current.currentVersion;

    // Update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (brand !== undefined) updateData.brand = brand;
    if (contractData !== undefined) updateData.contractData = contractData;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (valorTotal !== undefined) updateData.valorTotal = valorTotal;
    if (formaPagamento !== undefined) updateData.formaPagamento = formaPagamento;
    if (diaEmissaoNf !== undefined) updateData.diaEmissaoNf = diaEmissaoNf;
    if (diaVencimento !== undefined) updateData.diaVencimento = diaVencimento;
    if (dataInicio !== undefined) updateData.dataInicio = dataInicio ? new Date(dataInicio) : null;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (prazoMeses !== undefined) updateData.prazoMeses = prazoMeses;
    if (saveVersion) updateData.currentVersion = newVersion;

    const contract = await prisma.$transaction(async (tx) => {
      // Atualizar contrato
      const updated = await tx.contract.update({
        where: { id },
        data: updateData,
        include: {
          company: true,
          programs: true,
          versions: { orderBy: { version: 'desc' }, take: 10 },
        },
      });

      // Salvar nova versão se solicitado
      if (saveVersion && htmlContent) {
        await tx.contractVersion.create({
          data: {
            contractId: id,
            version: newVersion,
            htmlContent,
            contractData: contractData || {},
            changeNote: changeNote || `Versão ${newVersion}`,
          },
        });
      }

      // Atualizar programas se fornecidos
      if (programs) {
        await tx.contractProgram.deleteMany({ where: { contractId: id } });
        for (const p of programs) {
          await tx.contractProgram.create({
            data: {
              contractId: id,
              tipoPrograma: p.tipoPrograma,
              quantidade: p.quantidade,
              valorUnitario: p.valorUnitario,
              valorTotal: p.valorTotal,
              descricao: p.descricao,
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar contrato' },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Deletar contrato
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar contrato:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar contrato' },
      { status: 500 }
    );
  }
}
