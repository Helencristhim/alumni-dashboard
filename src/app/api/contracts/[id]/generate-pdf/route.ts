import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// POST /api/contracts/[id]/generate-pdf - Gerar PDF
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // Gerar HTML completo para PDF
    const htmlForPdf = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { font-size: 18pt; text-align: center; margin-bottom: 24px; }
    h2 { font-size: 14pt; margin-top: 20px; }
    h3 { font-size: 12pt; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; }
    ul { padding-left: 24px; }
    li { margin-bottom: 4px; }
    p { margin: 8px 0; }
  </style>
</head>
<body>
  ${contract.htmlContent}
</body>
</html>`;

    // Retornar HTML para renderização client-side como PDF
    // Em produção, usar serviço externo ou @react-pdf/renderer
    return NextResponse.json({
      success: true,
      data: {
        html: htmlForPdf,
        fileName: `contrato_${contract.number}_v${contract.currentVersion}.pdf`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}
