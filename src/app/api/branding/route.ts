import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/branding - Listar configurações de marca
export async function GET() {
  try {
    const brands = await prisma.brandConfig.findMany({
      orderBy: { brand: 'asc' },
    });
    return NextResponse.json({ success: true, data: brands });
  } catch (error) {
    console.error('Erro ao listar branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar branding' },
      { status: 500 }
    );
  }
}

// POST /api/branding - Criar/atualizar marca
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const brandConfig = await prisma.brandConfig.upsert({
      where: { brand: body.brand },
      update: {
        displayName: body.displayName,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        footerText: body.footerText,
        cnpj: body.cnpj,
        endereco: body.endereco,
        telefone: body.telefone,
        email: body.email,
      },
      create: {
        brand: body.brand,
        displayName: body.displayName,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor || '#3B82F6',
        secondaryColor: body.secondaryColor || '#8B5CF6',
        footerText: body.footerText,
        cnpj: body.cnpj,
        endereco: body.endereco,
        telefone: body.telefone,
        email: body.email,
      },
    });

    return NextResponse.json({ success: true, data: brandConfig });
  } catch (error) {
    console.error('Erro ao salvar branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar branding' },
      { status: 500 }
    );
  }
}
