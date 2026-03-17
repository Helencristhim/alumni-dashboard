import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/contract-templates/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.contractTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Erro ao obter template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter template' },
      { status: 500 }
    );
  }
}

// PUT /api/contract-templates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.contractTemplate.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        brand: body.brand,
        htmlContent: body.htmlContent,
        clauses: body.clauses,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}

// DELETE /api/contract-templates/[id] - Soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contractTemplate.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar template' },
      { status: 500 }
    );
  }
}
