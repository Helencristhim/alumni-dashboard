import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/branding/upload - Upload de logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brand = formData.get('brand') as string;

    if (!file || !brand) {
      return NextResponse.json(
        { success: false, error: 'Arquivo e marca são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido. Use PNG, JPG, SVG ou WebP.' },
        { status: 400 }
      );
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 2MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extensão do arquivo
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `logo_${brand}_${Date.now()}.${ext}`;

    // Salvar em /public/logos/
    const logosDir = path.join(process.cwd(), 'public', 'logos');
    await mkdir(logosDir, { recursive: true });

    const filePath = path.join(logosDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/logos/${fileName}`;

    return NextResponse.json({ success: true, data: { url, fileName } });
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
