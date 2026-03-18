import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

// Converter HTML para elementos DOCX
function htmlToDocxElements(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-3]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .split('\n');

  for (const line of lines) {
    const cleanText = line.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) continue;

    const isH1 = /<h1/i.test(line);
    const isH2 = /<h2/i.test(line);
    const isH3 = /<h3/i.test(line);
    const isBold = /<strong|<b>/i.test(line);
    const isListItem = /<li/i.test(line);

    if (isH1) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: cleanText, bold: true, size: 36 })],
        })
      );
    } else if (isH2) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: cleanText, bold: true, size: 28 })],
          spacing: { before: 240 },
        })
      );
    } else if (isH3) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: cleanText, bold: true, size: 24 })],
        })
      );
    } else if (isListItem) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${cleanText}`, size: 24 })],
          indent: { left: 720 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: cleanText, bold: isBold, size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  }

  return paragraphs;
}

// GET /api/contracts/[id]/serve-docx - Serve DOCX publicamente (para ZapSign buscar)
export async function GET(
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
      return new NextResponse('Contrato não encontrado', { status: 404 });
    }

    const elements = htmlToDocxElements(contract.htmlContent);
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children: elements,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);
    const fileName = `contrato_${contract.number}_v${contract.currentVersion}.docx`;

    return new NextResponse(uint8, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro ao servir DOCX:', error);
    return new NextResponse('Erro interno', { status: 500 });
  }
}
