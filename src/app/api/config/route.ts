import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// GET - Retorna configuração atual
export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'data_sources.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar configuração' },
      { status: 500 }
    );
  }
}

// POST - Salva nova configuração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modules } = body;

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Converte para formato YAML
    const configObject: Record<string, unknown> = {
      google_credentials: {
        service_account_key_path: './config/google-credentials.json'
      }
    };

    modules.forEach((module: {
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      sourceUrl: string;
      sheetName: string;
      columns: { internal: string; external: string }[];
    }) => {
      const columnMapping: Record<string, string> = {};
      module.columns.forEach(col => {
        if (col.external) {
          columnMapping[col.internal] = col.external;
        }
      });

      configObject[module.id] = {
        name: module.name,
        description: module.description,
        enabled: module.enabled,
        source: {
          type: 'google_sheets',
          url: module.sourceUrl || '',
          sheet_name: module.sheetName || ''
        },
        column_mapping: columnMapping
      };
    });

    // Adiciona configurações globais
    configObject.global_settings = {
      currency: 'BRL',
      currency_symbol: 'R$',
      date_format: 'DD/MM/YYYY',
      timezone: 'America/Sao_Paulo',
      cache_duration: 15,
      module_colors: {
        vendas_b2c: '#10B981',
        vendas_b2b: '#3B82F6',
        customer_care: '#8B5CF6',
        cancelamentos: '#EF4444',
        cobranca: '#F59E0B',
        alunos_ativos: '#06B6D4',
        marketing: '#EC4899'
      }
    };

    // Salva arquivo YAML
    const yamlContent = yaml.dump(configObject, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });

    const configPath = path.join(process.cwd(), 'config', 'data_sources.yaml');
    fs.writeFileSync(configPath, yamlContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar configuração' },
      { status: 500 }
    );
  }
}
