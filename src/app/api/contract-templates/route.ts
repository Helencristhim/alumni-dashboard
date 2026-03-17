import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/contract-templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const brand = searchParams.get('brand') || '';

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (brand) where.brand = brand;

    const templates = await prisma.contractTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar templates' },
      { status: 500 }
    );
  }
}

// POST /api/contract-templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const template = await prisma.contractTemplate.create({
      data: {
        name: body.name,
        type: body.type || 'CORPORATIVO',
        brand: body.brand || 'alumni',
        htmlContent: body.htmlContent || '',
        clauses: body.clauses,
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar template' },
      { status: 500 }
    );
  }
}
