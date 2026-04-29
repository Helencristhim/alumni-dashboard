import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import * as fs from 'fs';
import * as path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  ImageRun,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableBorders,
} from 'docx';

// Cor Alumni Red
const ALUMNI_RED = 'D42027';

// Carregar logo do disco
function loadLogo(): Buffer | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'logos', 'alumni-by-better.png'),
    '/var/task/public/logos/alumni-by-better.png',
  ];
  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
  }
  return null;
}

// Criar header Alumni com logo + linha vermelha
function createAlumniHeader(logoBuffer: Buffer | null): Header {
  const children: Paragraph[] = [];

  if (logoBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 180, height: 45 },
            type: 'png',
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: 'ALUMNI by Better',
            bold: true,
            size: 32,
            color: ALUMNI_RED,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  // Linha vermelha via borda inferior
  children.push(
    new Paragraph({
      spacing: { after: 0 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: ALUMNI_RED,
          space: 1,
        },
      },
      children: [new TextRun({ text: '', size: 2 })],
    })
  );

  return new Header({ children });
}

// Criar footer Alumni com linha vermelha + logo pequeno à direita
function createAlumniFooter(logoBuffer: Buffer | null): Footer {
  const children: Paragraph[] = [];

  // Linha vermelha
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 80 },
      border: {
        top: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: ALUMNI_RED,
          space: 1,
        },
      },
      children: [new TextRun({ text: '', size: 2 })],
    })
  );

  if (logoBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 120, height: 30 },
            type: 'png',
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: 'ALUMNI by Better',
            bold: true,
            size: 20,
            color: ALUMNI_RED,
            font: 'Times New Roman',
          }),
        ],
      })
    );
  }

  return new Footer({ children });
}

// Extrair alinhamento do estilo inline
function getAlignment(tag: string): typeof AlignmentType[keyof typeof AlignmentType] {
  const alignMatch = /text-align:\s*(center|right|justify|left)/i.exec(tag);
  if (alignMatch) {
    switch (alignMatch[1].toLowerCase()) {
      case 'center': return AlignmentType.CENTER;
      case 'right': return AlignmentType.RIGHT;
      case 'justify': return AlignmentType.JUSTIFIED;
    }
  }
  return AlignmentType.LEFT;
}

// Extrair cor do estilo inline
function getColor(tag: string): string | undefined {
  const colorMatch = /color:\s*([^;"]+)/i.exec(tag);
  if (colorMatch) {
    const c = colorMatch[1].trim();
    if (c.startsWith('#')) return c.replace('#', '');
    if (c.startsWith('rgb')) {
      const rgb = c.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        return rgb.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
      }
    }
  }
  return undefined;
}

// Parse inline formatting dentro de um bloco HTML (strong, em, u, span com cor)
function parseInlineRuns(html: string, defaults: { bold?: boolean; italic?: boolean; underline?: boolean; size: number; font: string; color?: string }): TextRun[] {
  const runs: TextRun[] = [];

  // Regex para capturar tags inline e texto entre elas
  const parts = html.split(/(<\/?(?:strong|b|em|i|u|s|span|mark)[^>]*>)/gi);

  let bold = defaults.bold || false;
  let italic = defaults.italic || false;
  let underline = defaults.underline || false;
  let strikethrough = false;
  let color = defaults.color;
  let highlight: string | undefined;
  const stateStack: Array<{ bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean; color?: string; highlight?: string }> = [];

  for (const part of parts) {
    if (!part) continue;

    // Opening tags
    if (/^<(strong|b)\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      bold = true;
    } else if (/^<(em|i)\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      italic = true;
    } else if (/^<u\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      underline = true;
    } else if (/^<s\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      strikethrough = true;
    } else if (/^<span\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      const spanColor = getColor(part);
      if (spanColor) color = spanColor;
    } else if (/^<mark\b/i.test(part)) {
      stateStack.push({ bold, italic, underline, strikethrough, color, highlight });
      const bgMatch = /background-color:\s*([^;"]+)/i.exec(part);
      if (bgMatch) {
        const bg = bgMatch[1].trim();
        if (bg.startsWith('#')) highlight = bg.replace('#', '');
      }
      if (!highlight) highlight = 'FFFF00';
    }
    // Closing tags
    else if (/^<\/(strong|b|em|i|u|s|span|mark)\b/i.test(part)) {
      const prev = stateStack.pop();
      if (prev) {
        bold = prev.bold;
        italic = prev.italic;
        underline = prev.underline;
        strikethrough = prev.strikethrough;
        color = prev.color;
        highlight = prev.highlight;
      }
    }
    // Text content
    else {
      const text = part.replace(/<[^>]*>/g, '');
      if (text) {
        const runOpts: Record<string, unknown> = {
          text,
          bold,
          italics: italic,
          underline: underline ? {} : undefined,
          strike: strikethrough || undefined,
          size: defaults.size,
          font: defaults.font,
        };
        if (color) runOpts.color = color;
        if (highlight) runOpts.highlight = highlight;
        runs.push(new TextRun(runOpts as ConstructorParameters<typeof TextRun>[0]));
      }
    }
  }

  if (runs.length === 0) {
    const plainText = html.replace(/<[^>]*>/g, '').trim();
    if (plainText) {
      runs.push(new TextRun({
        text: plainText,
        size: defaults.size,
        font: defaults.font,
        bold: defaults.bold,
        color: defaults.color,
      }));
    }
  }

  return runs;
}

// Parse tabelas HTML
function parseTable(tableHtml: string): Paragraph[] {
  const result: Paragraph[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;

  const rows: Array<{ cells: Array<{ text: string; isHeader: boolean }> }> = [];
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cells: Array<{ text: string; isHeader: boolean }> = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push({
        text: cellMatch[2].replace(/<[^>]*>/g, '').trim(),
        isHeader: cellMatch[1].toLowerCase() === 'th',
      });
    }
    if (cells.length > 0) rows.push({ cells });
  }

  if (rows.length === 0) return result;

  const maxCols = Math.max(...rows.map(r => r.cells.length));

  const tableRows = rows.map(row => {
    const tableCells = [];
    for (let i = 0; i < maxCols; i++) {
      const cell = row.cells[i];
      tableCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cell?.text || '',
                  bold: cell?.isHeader || false,
                  size: 24,
                  font: 'Times New Roman',
                }),
              ],
            }),
          ],
          shading: cell?.isHeader ? { fill: 'f0f0f0' } : undefined,
        })
      );
    }
    return new TableRow({ children: tableCells });
  });

  const table = new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    },
  });

  // Retornar tabela como wrapper (docx requer ISectionChildren)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.push(table as any);
  return result;
}

// Converter HTML completo para elementos docx
function htmlToDocxElements(html: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const FONT = 'Times New Roman';

  // Extrair e processar tabelas separadamente
  const parts = html.split(/(<table[\s\S]*?<\/table>)/gi);

  for (const part of parts) {
    // Tabela
    if (/^<table/i.test(part)) {
      elements.push(...parseTable(part));
      continue;
    }

    // Blocos normais
    const lines = part
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '</p>\n')
      .replace(/<\/h[1-3]>/gi, '</h_end>\n')
      .replace(/<\/li>/gi, '</li>\n')
      .replace(/<\/blockquote>/gi, '</blockquote>\n')
      .replace(/<hr\s*\/?>/gi, '<hr/>\n')
      .split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // HR - linha vermelha Alumni
      if (/^<hr/i.test(trimmed)) {
        elements.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 6,
                color: ALUMNI_RED,
                space: 1,
              },
            },
            children: [new TextRun({ text: '', size: 2 })],
          })
        );
        continue;
      }

      const cleanText = trimmed.replace(/<[^>]*>/g, '').trim();
      if (!cleanText) continue;

      const alignment = getAlignment(trimmed);

      // H1
      if (/<h1/i.test(trimmed)) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 160 },
            children: parseInlineRuns(trimmed.replace(/<\/?h1[^>]*>/gi, ''), {
              bold: true,
              size: 40, // 20pt
              font: FONT,
              color: '111111',
            }),
          })
        );
      }
      // H2
      else if (/<h2/i.test(trimmed)) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: alignment !== AlignmentType.LEFT ? alignment : AlignmentType.LEFT,
            spacing: { before: 240, after: 120 },
            children: parseInlineRuns(trimmed.replace(/<\/?h2[^>]*>/gi, ''), {
              bold: true,
              size: 30, // 15pt
              font: FONT,
              color: '111111',
            }),
          })
        );
      }
      // H3
      else if (/<h3/i.test(trimmed)) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            alignment: alignment !== AlignmentType.LEFT ? alignment : AlignmentType.LEFT,
            spacing: { before: 180, after: 80 },
            children: parseInlineRuns(trimmed.replace(/<\/?h3[^>]*>/gi, ''), {
              bold: true,
              size: 26, // 13pt
              font: FONT,
              color: '222222',
            }),
          })
        );
      }
      // LI
      else if (/<li/i.test(trimmed)) {
        const liContent = trimmed.replace(/<\/?li[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '');
        elements.push(
          new Paragraph({
            indent: { left: 560 },
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({ text: '•  ', size: 24, font: FONT }),
              ...parseInlineRuns(liContent, { size: 24, font: FONT }),
            ],
          })
        );
      }
      // Blockquote
      else if (/<blockquote/i.test(trimmed)) {
        const bqContent = trimmed.replace(/<\/?blockquote[^>]*>/gi, '').replace(/<\/?p[^>]*>/gi, '');
        elements.push(
          new Paragraph({
            indent: { left: 320 },
            spacing: { before: 120, after: 120 },
            border: {
              left: {
                style: BorderStyle.SINGLE,
                size: 8,
                color: ALUMNI_RED,
                space: 8,
              },
            },
            children: parseInlineRuns(bqContent, {
              size: 24,
              font: FONT,
              italic: true,
              color: '555555',
            }),
          })
        );
      }
      // Parágrafo normal
      else {
        const pContent = trimmed.replace(/<\/?p[^>]*>/gi, '').replace(/<\/?div[^>]*>/gi, '');
        const runs = parseInlineRuns(pContent, { size: 24, font: FONT });
        if (runs.length > 0) {
          elements.push(
            new Paragraph({
              alignment,
              spacing: { before: 80, after: 80 },
              children: runs,
            })
          );
        }
      }
    }
  }

  return elements;
}

// POST /api/b2c-contracts/[id]/generate-docx - Gerar DOCX
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contract = await prisma.b2CContract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const isAlumni = contract.brand === 'alumni';
    const logoBuffer = isAlumni ? loadLogo() : null;
    const elements = htmlToDocxElements(contract.htmlContent);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 24,
              color: '1a1a1a',
            },
            paragraph: {
              spacing: { line: 360 }, // 1.6 line height
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,   // 1 inch
                right: 1080,  // 0.75 inch
                bottom: 1800, // 1.25 inch
                left: 1080,   // 0.75 inch
              },
            },
          },
          headers: isAlumni
            ? { default: createAlumniHeader(logoBuffer) }
            : undefined,
          footers: isAlumni
            ? { default: createAlumniFooter(logoBuffer) }
            : undefined,
          children: elements,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `contrato_${contract.number}_v${contract.currentVersion}.docx`;
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar DOCX:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar DOCX' },
      { status: 500 }
    );
  }
}
