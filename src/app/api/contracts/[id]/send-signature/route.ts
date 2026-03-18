import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createDocumentFromBase64 } from '@/lib/contracts/zapsign';
import { SignatoryData } from '@/types/contracts';
import { generateContractPdf } from '@/lib/contracts/pdf-generator';

// POST /api/contracts/[id]/send-signature - Enviar para assinatura via ZapSign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { signatories } = body as { signatories: SignatoryData[] };

    if (!signatories?.length) {
      return NextResponse.json(
        { success: false, error: 'Informe pelo menos um signatário' },
        { status: 400 }
      );
    }

    // Buscar contrato
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

    if (contract.status === 'SIGNED') {
      return NextResponse.json(
        { success: false, error: 'Contrato já foi assinado e não pode ser reenviado' },
        { status: 400 }
      );
    }

    // 1. Gerar PDF real do contrato
    const pdfBytes = await generateContractPdf(contract.htmlContent, {
      title: contract.title,
      brand: contract.brand,
    });

    // 2. Converter para base64
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');

    // 3. Enviar para ZapSign com PDF real
    const docName = `${contract.title} - ${contract.company.razaoSocial}`;
    const docResult = await createDocumentFromBase64(
      docName,
      base64Pdf,
      signatories,
      {
        reminderEveryNDays: 3,
        externalId: contract.id,
      }
    );

    // 4. Salvar signatários e atualizar contrato em transação
    const updated = await prisma.$transaction(async (tx) => {
      await tx.contractSignatory.deleteMany({
        where: { contractId: id },
      });

      for (let i = 0; i < signatories.length; i++) {
        const zapSigner = docResult.signers[i];
        await tx.contractSignatory.create({
          data: {
            contractId: id,
            name: signatories[i].name,
            email: signatories[i].email,
            cpf: signatories[i].cpf ?? '',
            role: signatories[i].role,
            signatoryType: signatories[i].signatoryType,
            status: 'pending',
            signUrl: zapSigner?.sign_url ?? '',
            zapsignSignerId: zapSigner?.token ?? '',
          },
        });
      }

      return tx.contract.update({
        where: { id },
        data: {
          status: 'SENT_FOR_SIGNATURE',
          zapsignDocId: docResult.token,
          zapsignStatus: 'pending',
        },
        include: {
          signatories: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        contract: updated,
        signatories: updated.signatories.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          signatoryType: s.signatoryType,
          status: s.status,
          signUrl: s.signUrl,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao enviar para assinatura:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao enviar para assinatura';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
