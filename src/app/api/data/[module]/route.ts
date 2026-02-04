import { NextRequest, NextResponse } from 'next/server';
import {
  loadVendasB2C,
  loadVendasB2B,
  loadCustomerCare,
  loadCancelamentos,
  loadCobranca,
  loadAlunosAtivos,
  loadAcompanhamento,
  loadMarketing,
  loadProspecB2B,
  invalidateCache
} from '@/lib/data/dataLoader';

// Força rotas dinâmicas - desabilita cache do Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ModuleName = 'vendas_b2c' | 'vendas_b2b' | 'customer_care' | 'cancelamentos' | 'cobranca' | 'alunos_ativos' | 'acompanhamento' | 'marketing' | 'prospec_b2b';

const moduleLoaders: Record<ModuleName, (force: boolean) => Promise<unknown>> = {
  vendas_b2c: loadVendasB2C,
  vendas_b2b: loadVendasB2B,
  customer_care: loadCustomerCare,
  cancelamentos: loadCancelamentos,
  cobranca: loadCobranca,
  alunos_ativos: loadAlunosAtivos,
  acompanhamento: loadAcompanhamento,
  marketing: loadMarketing,
  prospec_b2b: loadProspecB2B,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const { module } = await params;
    const moduleName = module.replace(/-/g, '_') as ModuleName;

    // Verifica se o módulo existe
    if (!moduleLoaders[moduleName]) {
      return NextResponse.json(
        { error: `Módulo "${module}" não encontrado` },
        { status: 404 }
      );
    }

    // Verifica se deve forçar refresh
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      invalidateCache(moduleName);
    }

    // Carrega os dados
    const data = await moduleLoaders[moduleName](forceRefresh);

    // Log de debug para vendas_b2c
    if (moduleName === 'vendas_b2c') {
      const vendas = (data as { data: Array<{ cancelamento: boolean; data_venda: unknown; valor_total: number }> }).data;
      const totalRegistros = vendas.length;
      const ativos = vendas.filter(v => v.cancelamento === false).length;
      const cancelados = vendas.filter(v => v.cancelamento === true).length;
      const valorAtivos = vendas.filter(v => v.cancelamento === false).reduce((s, v) => s + (v.valor_total || 0), 0);

      // Filtra janeiro 2026
      const jan2026 = vendas.filter(v => {
        const rawDate = v.data_venda as unknown;
        if (typeof rawDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
          const [, month, year] = rawDate.split('/').map(Number);
          return month === 1 && year === 2026;
        }
        return false;
      });
      const jan2026Ativos = jan2026.filter(v => v.cancelamento === false);
      const jan2026Valor = jan2026Ativos.reduce((s, v) => s + (v.valor_total || 0), 0);

      console.log(`[DEBUG] Total registros: ${totalRegistros}`);
      console.log(`[DEBUG] Ativos (FALSE): ${ativos}`);
      console.log(`[DEBUG] Cancelados (TRUE): ${cancelados}`);
      console.log(`[DEBUG] Valor total ativos: R$ ${valorAtivos.toFixed(2)}`);
      console.log(`[DEBUG] Janeiro 2026 - Total: ${jan2026.length}, Ativos: ${jan2026Ativos.length}, Valor: R$ ${jan2026Valor.toFixed(2)}`);
    }

    // Retorna com headers anti-cache
    return NextResponse.json(
      {
        success: true,
        module: moduleName,
        data,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Erro ao carregar dados:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const { module } = await params;
    const moduleName = module.replace(/-/g, '_') as ModuleName;

    // Invalida cache do módulo
    invalidateCache(moduleName);

    return NextResponse.json({
      success: true,
      message: `Cache do módulo "${module}" invalidado`,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao invalidar cache' },
      { status: 500 }
    );
  }
}
