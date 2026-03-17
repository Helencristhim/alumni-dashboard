import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/branding/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandConfig = await prisma.brandConfig.findUnique({
      where: { id },
    });

    if (!brandConfig) {
      return NextResponse.json(
        { success: false, error: 'Marca não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: brandConfig });
  } catch (error) {
    console.error('Erro ao obter branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter branding' },
      { status: 500 }
    );
  }
}

// DELETE /api/branding/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.brandConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar branding' },
      { status: 500 }
    );
  }
}
