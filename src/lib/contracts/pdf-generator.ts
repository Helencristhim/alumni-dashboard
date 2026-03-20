import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// GERADOR DE PDF PARA CONTRATOS (com papel timbrado)
// ============================================================

interface PdfOptions {
  title?: string;
  brand?: string;
}

// Converte HTML para texto limpo com estrutura
function htmlToTextBlocks(html: string): Array<{ text: string; type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'br' }> {
  const blocks: Array<{ text: string; type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'br' }> = [];

  const parts = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '</p>\n')
    .replace(/<\/h1>/gi, '</h1>\n')
    .replace(/<\/h2>/gi, '</h2>\n')
    .replace(/<\/h3>/gi, '</h3>\n')
    .replace(/<\/li>/gi, '</li>\n')
    .replace(/<\/tr>/gi, '</tr>\n')
    .replace(/<\/div>/gi, '</div>\n')
    .split('\n');

  for (const part of parts) {
    const cleanText = part.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      blocks.push({ text: '', type: 'br' });
      continue;
    }

    let type: 'h1' | 'h2' | 'h3' | 'p' | 'li' = 'p';
    if (/<h1/i.test(part)) type = 'h1';
    else if (/<h2/i.test(part)) type = 'h2';
    else if (/<h3/i.test(part)) type = 'h3';
    else if (/<li/i.test(part)) type = 'li';

    blocks.push({ text: cleanText, type });
  }

  return blocks;
}

// Quebrar texto em linhas que cabem na largura
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

// Tentar carregar logo do disco
async function loadLogo(pdfDoc: PDFDocument): Promise<PDFImage | null> {
  try {
    // Tentar vários caminhos possíveis
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'logos', 'alumni-by-better.png'),
      path.join(process.cwd(), '.next', 'static', 'media', 'alumni-by-better.png'),
      '/var/task/public/logos/alumni-by-better.png',
    ];

    for (const logoPath of possiblePaths) {
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        return await pdfDoc.embedPng(logoBytes);
      }
    }
    return null;
  } catch (err) {
    console.error('Erro ao carregar logo para PDF:', err);
    return null;
  }
}

// Cor vermelha Alumni
const ALUMNI_RED = rgb(0.831, 0.125, 0.153); // #D42027

export async function generateContractPdf(
  htmlContent: string,
  options?: PdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const isAlumni = !options?.brand || options.brand === 'alumni';

  // Carregar logo se marca Alumni
  let logo: PDFImage | null = null;
  if (isAlumni) {
    logo = await loadLogo(pdfDoc);
  }

  // Configuração de página A4
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 60;
  const marginRight = 60;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Margens ajustadas para papel timbrado
  const headerHeight = isAlumni ? 80 : 0;
  const footerHeight = isAlumni ? 55 : 0;
  const marginTop = 50 + headerHeight;
  const marginBottom = 40 + footerHeight;

  let currentPage: PDFPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - marginTop;
  let pageCount = 1;

  // Desenhar papel timbrado Alumni em uma página
  const drawLetterhead = (page: PDFPage) => {
    if (!isAlumni) return;

    // === HEADER ===
    // Logo centralizado no topo
    if (logo) {
      const logoAspect = logo.width / logo.height;
      const logoHeight = 40;
      const logoWidth = logoHeight * logoAspect;
      const logoX = (pageWidth - logoWidth) / 2;
      page.drawImage(logo, {
        x: logoX,
        y: pageHeight - 55,
        width: logoWidth,
        height: logoHeight,
      });
    } else {
      // Fallback texto se logo não carregou
      page.drawText('ALUMNI by Better', {
        x: pageWidth / 2 - 60,
        y: pageHeight - 45,
        size: 16,
        font: timesBoldFont,
        color: ALUMNI_RED,
      });
    }

    // Linha vermelha header
    page.drawRectangle({
      x: marginLeft - 10,
      y: pageHeight - 68,
      width: contentWidth + 20,
      height: 2,
      color: ALUMNI_RED,
    });

    // === FOOTER ===
    // Linha vermelha footer
    page.drawRectangle({
      x: marginLeft - 10,
      y: footerHeight - 10,
      width: contentWidth + 20,
      height: 2,
      color: ALUMNI_RED,
    });

    // Logo pequeno no rodapé à direita
    if (logo) {
      const logoAspect = logo.width / logo.height;
      const smallLogoHeight = 24;
      const smallLogoWidth = smallLogoHeight * logoAspect;
      page.drawImage(logo, {
        x: pageWidth - marginRight - smallLogoWidth,
        y: footerHeight - 38,
        width: smallLogoWidth,
        height: smallLogoHeight,
      });
    } else {
      page.drawText('ALUMNI by Better', {
        x: pageWidth - marginRight - 110,
        y: footerHeight - 30,
        size: 10,
        font: timesBoldFont,
        color: ALUMNI_RED,
      });
    }
  };

  // Desenhar timbrado na primeira página
  drawLetterhead(currentPage);

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pageCount++;
    drawLetterhead(currentPage);
    yPosition = pageHeight - marginTop;
  };

  const ensureSpace = (needed: number) => {
    if (yPosition - needed < marginBottom) {
      addNewPage();
    }
  };

  const drawText = (
    text: string,
    font: PDFFont,
    size: number,
    x: number,
    opts?: { color?: ReturnType<typeof rgb>; maxWidth?: number; align?: 'left' | 'center' }
  ) => {
    const maxWidth = opts?.maxWidth ?? contentWidth;
    const lines = wrapText(text, font, size, maxWidth);
    const lineHeight = size * 1.4;

    for (const line of lines) {
      ensureSpace(lineHeight);

      let drawX = x;
      if (opts?.align === 'center') {
        const textWidth = font.widthOfTextAtSize(line, size);
        drawX = marginLeft + (contentWidth - textWidth) / 2;
      }

      currentPage.drawText(line, {
        x: drawX,
        y: yPosition,
        size,
        font,
        color: opts?.color ?? rgb(0.1, 0.1, 0.1),
      });
      yPosition -= lineHeight;
    }
  };

  // Título do documento
  if (options?.title) {
    drawText(options.title, timesBoldFont, 16, marginLeft, { align: 'center' });
    yPosition -= 20;
  }

  // Processar blocos HTML
  const blocks = htmlToTextBlocks(htmlContent);
  let consecutiveBrs = 0;

  for (const block of blocks) {
    if (block.type === 'br') {
      consecutiveBrs++;
      if (consecutiveBrs <= 2) {
        yPosition -= 8;
      }
      continue;
    }
    consecutiveBrs = 0;

    switch (block.type) {
      case 'h1':
        yPosition -= 12;
        ensureSpace(24);
        drawText(block.text, timesBoldFont, 16, marginLeft, {
          color: rgb(0.1, 0.1, 0.4),
          align: 'center',
        });
        yPosition -= 8;
        break;

      case 'h2':
        yPosition -= 10;
        ensureSpace(20);
        drawText(block.text, timesBoldFont, 13, marginLeft, {
          color: rgb(0.1, 0.2, 0.6),
        });
        yPosition -= 4;
        break;

      case 'h3':
        yPosition -= 6;
        ensureSpace(18);
        drawText(block.text, timesBoldFont, 11, marginLeft);
        yPosition -= 2;
        break;

      case 'li':
        ensureSpace(16);
        drawText(`\u2022  ${block.text}`, timesFont, 11, marginLeft + 15, {
          maxWidth: contentWidth - 15,
        });
        break;

      case 'p':
      default:
        ensureSpace(16);
        drawText(block.text, timesFont, 11, marginLeft);
        break;
    }
  }

  return pdfDoc.save();
}
