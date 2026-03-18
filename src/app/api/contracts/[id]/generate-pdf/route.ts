import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const ALUMNI_LOGO_URL = '/logos/alumni-by-better.png';

function getLetterheadHeader(brand: string, baseUrl: string): string {
  if (brand !== 'alumni') return '';
  return `
    <div style="text-align:center;padding-top:20px;padding-bottom:10px;">
      <img src="${baseUrl}${ALUMNI_LOGO_URL}" alt="Alumni by Better" style="height:56px;object-fit:contain;" />
    </div>
    <div style="margin:0 20px;height:2px;background-color:#D42027;"></div>
  `;
}

function getLetterheadFooter(brand: string, baseUrl: string): string {
  if (brand !== 'alumni') return '';
  return `
    <div style="margin:40px 20px 0;height:2px;background-color:#D42027;"></div>
    <div style="text-align:right;padding:10px 24px 20px;">
      <img src="${baseUrl}${ALUMNI_LOGO_URL}" alt="Alumni by Better" style="height:36px;object-fit:contain;" />
    </div>
  `;
}

// POST /api/contracts/[id]/generate-pdf - Gerar PDF
export async function POST(
  request: NextRequest,
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

    // Base URL para assets (logo)
    const baseUrl = request.nextUrl.origin;

    // Gerar HTML completo para PDF com papel timbrado
    const htmlForPdf = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 20mm 15mm 25mm 15mm;

      @top-center {
        content: element(page-header);
      }
      @bottom-center {
        content: element(page-footer);
      }
    }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 0 40px;
    }
    h1 { font-size: 16pt; text-align: center; margin-bottom: 24px; font-weight: bold; }
    h2 { font-size: 13pt; margin-top: 20px; font-weight: bold; color: #1a56db; }
    h3 { font-size: 12pt; margin-top: 16px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #999; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    ul { padding-left: 24px; }
    li { margin-bottom: 4px; }
    p { margin: 8px 0; }
    strong { font-weight: bold; }
  </style>
</head>
<body>
  ${getLetterheadHeader(contract.brand, baseUrl)}
  ${contract.htmlContent}
  ${getLetterheadFooter(contract.brand, baseUrl)}
</body>
</html>`;

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
