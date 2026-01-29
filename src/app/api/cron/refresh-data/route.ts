import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  MODULE_INFO,
  calculateHash,
  updateModuleSnapshot,
  recordScheduledTaskRun,
} from '@/lib/activity/dataTracker';
import { logActivity } from '@/lib/activity/logger';

// Verificar se a requisicao vem do Vercel Cron
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Em desenvolvimento, permitir sem secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  if (!cronSecret) {
    console.error('CRON_SECRET nao configurado');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// Simula busca de dados do Google Sheets
// Em producao, usar a API real
async function fetchSheetData(moduleId: string): Promise<unknown[][] | null> {
  const moduleInfo = MODULE_INFO[moduleId];

  if (!moduleInfo?.sheetId) {
    console.log(`Sheet ID nao configurado para modulo ${moduleId}`);
    return null;
  }

  // TODO: Implementar busca real usando Google Sheets API
  // Por enquanto, retorna dados mockados para teste
  try {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Retornar dados mockados
    return [
      ['Header1', 'Header2', 'Header3'],
      ['Data1', 'Data2', 'Data3'],
      [`Updated at ${new Date().toISOString()}`, 'Value', 'Test'],
    ];
  } catch (error) {
    console.error(`Erro ao buscar dados do modulo ${moduleId}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Verificar autenticacao
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Record<string, { status: string; changed?: boolean; error?: string }> = {};

  try {
    // Registrar inicio da tarefa
    await logActivity({
      type: 'DATA_REFRESH',
      description: 'Iniciando refresh de dados de todos os modulos',
    });

    // Processar cada modulo
    for (const moduleId of Object.keys(MODULE_INFO)) {
      try {
        const data = await fetchSheetData(moduleId);

        if (!data) {
          results[moduleId] = { status: 'skipped', error: 'Sheet nao configurado' };
          continue;
        }

        // Calcular hash do conteudo
        const contentString = JSON.stringify(data);
        const newHash = await calculateHash(contentString);
        const rowCount = data.length;

        // Obter hash anterior
        const snapshot = await prisma.moduleDataSnapshot.findUnique({
          where: { moduleId },
        });

        const previousHash = snapshot?.contentHash || '';
        const changed = previousHash !== newHash;

        // Atualizar snapshot se mudou
        if (changed) {
          await updateModuleSnapshot(moduleId, newHash, rowCount);

          await logActivity({
            type: 'DATA_UPDATED',
            moduleId,
            description: `Dados atualizados em ${MODULE_INFO[moduleId].name}`,
            metadata: {
              previousHash,
              newHash,
              rowCount,
            },
          });
        }

        results[moduleId] = { status: 'success', changed };
      } catch (error) {
        console.error(`Erro no modulo ${moduleId}:`, error);
        results[moduleId] = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        await logActivity({
          type: 'DATA_ERROR',
          moduleId,
          description: `Erro ao processar ${MODULE_INFO[moduleId].name}`,
          metadata: { error: String(error) },
        });
      }
    }

    // Registrar conclusao da tarefa
    const duration = Date.now() - startTime;
    await recordScheduledTaskRun('refresh-data', 'success', JSON.stringify({ results, duration }));

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    console.error('Erro no cron refresh-data:', error);

    await recordScheduledTaskRun(
      'refresh-data',
      'error',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}

// Tambem aceita POST para chamadas manuais
export async function POST(request: NextRequest) {
  return GET(request);
}
