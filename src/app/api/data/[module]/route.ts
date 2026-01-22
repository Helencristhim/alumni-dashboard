import { NextRequest, NextResponse } from 'next/server';
import {
  loadVendasB2C,
  loadVendasB2B,
  loadCustomerCare,
  loadCancelamentos,
  loadCobranca,
  loadAlunosAtivos,
  loadMarketing,
  invalidateCache
} from '@/lib/data/dataLoader';

type ModuleName = 'vendas_b2c' | 'vendas_b2b' | 'customer_care' | 'cancelamentos' | 'cobranca' | 'alunos_ativos' | 'marketing';

const moduleLoaders: Record<ModuleName, (force: boolean) => Promise<unknown>> = {
  vendas_b2c: loadVendasB2C,
  vendas_b2b: loadVendasB2B,
  customer_care: loadCustomerCare,
  cancelamentos: loadCancelamentos,
  cobranca: loadCobranca,
  alunos_ativos: loadAlunosAtivos,
  marketing: loadMarketing,
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

    return NextResponse.json({
      success: true,
      module: moduleName,
      data,
      timestamp: new Date().toISOString(),
    });

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
