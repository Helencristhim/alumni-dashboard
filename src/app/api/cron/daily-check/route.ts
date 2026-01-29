import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { MODULE_INFO, recordScheduledTaskRun } from '@/lib/activity/dataTracker';
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

export async function GET(request: NextRequest) {
  // Verificar autenticacao
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Obter inicio do dia (Sao Paulo)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const results: Record<
      string,
      { hadUpdate: boolean; lastUpdate?: Date | null }
    > = {};

    // Verificar cada modulo
    for (const moduleId of Object.keys(MODULE_INFO)) {
      // Buscar se houve DATA_UPDATED hoje
      const todayUpdate = await prisma.activityLog.findFirst({
        where: {
          moduleId,
          type: 'DATA_UPDATED',
          createdAt: { gte: todayStart },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Buscar ultima atualizacao
      const lastUpdate = await prisma.activityLog.findFirst({
        where: {
          moduleId,
          type: 'DATA_UPDATED',
        },
        orderBy: { createdAt: 'desc' },
      });

      const hadUpdate = !!todayUpdate;
      results[moduleId] = {
        hadUpdate,
        lastUpdate: lastUpdate?.createdAt,
      };

      // Se nao houve atualizacao hoje, registrar DATA_NO_CHANGE
      if (!hadUpdate) {
        await logActivity({
          type: 'DATA_NO_CHANGE',
          moduleId,
          description: `Nenhuma atualizacao em ${MODULE_INFO[moduleId].name} hoje`,
          metadata: {
            lastUpdate: lastUpdate?.createdAt,
            daysSinceUpdate: lastUpdate
              ? Math.floor(
                  (now.getTime() - lastUpdate.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
          },
        });
      }
    }

    // Resumo
    const modulesWithUpdate = Object.values(results).filter((r) => r.hadUpdate).length;
    const modulesWithoutUpdate = Object.values(results).filter((r) => !r.hadUpdate).length;

    // Registrar log geral
    await logActivity({
      type: 'DATA_REFRESH',
      description: `Verificacao diaria: ${modulesWithUpdate} modulos atualizados, ${modulesWithoutUpdate} sem atualizacao`,
      metadata: {
        date: todayStart.toISOString(),
        modulesWithUpdate,
        modulesWithoutUpdate,
      },
    });

    // Registrar conclusao da tarefa
    const duration = Date.now() - startTime;
    await recordScheduledTaskRun(
      'daily-check',
      'success',
      JSON.stringify({
        results,
        summary: { modulesWithUpdate, modulesWithoutUpdate },
        duration,
      })
    );

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      date: todayStart.toISOString(),
      summary: {
        modulesWithUpdate,
        modulesWithoutUpdate,
      },
      results,
    });
  } catch (error) {
    console.error('Erro no cron daily-check:', error);

    await recordScheduledTaskRun(
      'daily-check',
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
