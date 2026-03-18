import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/b2c-contracts/[id] - Obter contrato B2C
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.b2CContract.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { version: 'desc' } },
        signatories: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contract });
  } catch (error) {
    console.error('Erro ao obter contrato B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter contrato B2C' },
      { status: 500 }
    );
  }
}

// PUT /api/b2c-contracts/[id] - Atualizar contrato B2C
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
      saveVersion,
      changeNote,
    } = body;

    // Obter contrato atual
    const current = await prisma.b2CContract.findUnique({
      where: { id },
      select: { currentVersion: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Contrato nao encontrado' },
        { status: 404 }
      );
    }

    const newVersion = saveVersion ? current.currentVersion + 1 : current.currentVersion;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (brand !== undefined) updateData.brand = brand;
    if (nomeAluno !== undefined) updateData.nomeAluno = nomeAluno;
    if (cpfAluno !== undefined) updateData.cpfAluno = cpfAluno;
    if (emailAluno !== undefined) updateData.emailAluno = emailAluno;
    if (telefoneAluno !== undefined) updateData.telefoneAluno = telefoneAluno;
    if (enderecoAluno !== undefined) updateData.enderecoAluno = enderecoAluno;
    if (valorTotal !== undefined) updateData.valorTotal = valorTotal;
    if (formaPagamento !== undefined) updateData.formaPagamento = formaPagamento;
    if (tipoCobranca !== undefined) updateData.tipoCobranca = tipoCobranca;
    if (parcelas !== undefined) updateData.parcelas = parcelas;
    if (contractData !== undefined) updateData.contractData = contractData;
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
    if (saveVersion) updateData.currentVersion = newVersion;

    // Auto-set faturamentoHibrido when type changes
    if (type !== undefined) {
      updateData.faturamentoHibrido = type === 'COMMUNITY' || type === 'COMMUNITY_FLOW';
    }

    const contract = await prisma.$transaction(async (tx) => {
      // Atualizar contrato
      const updated = await tx.b2CContract.update({
        where: { id },
        data: updateData,
        include: {
          versions: { orderBy: { version: 'desc' }, take: 10 },
        },
      });

      // Salvar nova versao se solicitado
      if (saveVersion && htmlContent) {
        await tx.b2CContractVersion.create({
          data: {
            contractId: id,
            version: newVersion,
            htmlContent,
            contractData: contractData || {},
            changeNote: changeNote || `Versao ${newVersion}`,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (error) {
    console.error('Erro ao atualizar contrato B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar contrato B2C' },
      { status: 500 }
    );
  }
}

// DELETE /api/b2c-contracts/[id] - Deletar contrato B2C
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.b2CContract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar contrato B2C:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar contrato B2C' },
      { status: 500 }
    );
  }
}
