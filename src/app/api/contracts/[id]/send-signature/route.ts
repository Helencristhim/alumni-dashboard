import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createDocument } from '@/lib/contracts/zapsign';
import { SignatoryData } from '@/types/contracts';

// POST /api/contracts/[id]/send-signature - Enviar para assinatura
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { signatories, pdfUrl } = body as {
      signatories: SignatoryData[];
      pdfUrl: string;
    };

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

    // Enviar para ZapSign
    const docResult = await createDocument(
      `${contract.title} - ${contract.company.razaoSocial}`,
      pdfUrl,
      signatories
    );

    // Atualizar contrato com dados da assinatura
    const updated = await prisma.$transaction(async (tx) => {
      // Salvar signatários
      for (let i = 0; i < signatories.length; i++) {
        await tx.contractSignatory.create({
          data: {
            contractId: id,
            name: signatories[i].name,
            email: signatories[i].email,
            cpf: signatories[i].cpf,
            role: signatories[i].role,
            zapsignSignerId: docResult.signers[i]?.token,
          },
        });
      }

      // Atualizar status do contrato
      return tx.contract.update({
        where: { id },
        data: {
          status: 'SENT_FOR_SIGNATURE',
          zapsignDocId: docResult.token,
          zapsignStatus: 'pending',
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        contract: updated,
        zapsign: docResult,
      },
    });
  } catch (error) {
    console.error('Erro ao enviar para assinatura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar para assinatura' },
      { status: 500 }
    );
  }
}
