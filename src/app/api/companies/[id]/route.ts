import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/companies/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            number: true,
            title: true,
            status: true,
            valorTotal: true,
            createdAt: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('Erro ao obter empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter empresa' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const company = await prisma.company.update({
      where: { id },
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

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar empresa' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.company.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao desativar empresa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao desativar empresa' },
      { status: 500 }
    );
  }
}
