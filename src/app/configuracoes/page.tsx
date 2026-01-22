'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  FileSpreadsheet,
  Link2,
  Table,
  HelpCircle,
  Loader2
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  enabled: boolean;
  sourceUrl: string;
  sheetName: string;
  columns: { internal: string; label: string; external: string; required: boolean }[];
}

const getInitialModules = (): ModuleConfig[] => [
  {
    id: 'vendas_b2c',
    name: 'Vendas B2C',
    description: 'Faturamento e matrículas do canal direto ao consumidor',
    color: '#10B981',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data_venda', label: 'Data da Venda', external: '', required: true },
      { internal: 'faturamento', label: 'Valor/Faturamento', external: '', required: true },
      { internal: 'produto', label: 'Produto/Curso', external: '', required: true },
      { internal: 'tipo_matricula', label: 'Tipo (Novo/Renovação)', external: '', required: true },
      { internal: 'cancelamento', label: 'Cancelamento (FALSE=Ativo, TRUE=Cancelado)', external: '', required: true },
      { internal: 'aluno_id', label: 'ID do Aluno (CPF)', external: '', required: false },
      { internal: 'aluno_nome', label: 'Nome do Aluno', external: '', required: false },
      { internal: 'forma_pagamento', label: 'Forma de Pagamento', external: '', required: false },
      { internal: 'parcelas', label: 'Quantidade de Parcelas', external: '', required: false },
      { internal: 'vendedor', label: 'Vendedor', external: '', required: false },
    ]
  },
  {
    id: 'vendas_b2b',
    name: 'Vendas B2B',
    description: 'Contratos corporativos e pipeline empresarial',
    color: '#3B82F6',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data_contrato', label: 'Data do Contrato', external: '', required: true },
      { internal: 'empresa', label: 'Nome da Empresa', external: '', required: true },
      { internal: 'cnpj', label: 'CNPJ', external: '', required: false },
      { internal: 'valor_contrato', label: 'Valor do Contrato', external: '', required: true },
      { internal: 'valor_mensal', label: 'Valor Mensal', external: '', required: false },
      { internal: 'duracao_meses', label: 'Duração (meses)', external: '', required: false },
      { internal: 'status_pipeline', label: 'Status no Pipeline', external: '', required: true },
      { internal: 'probabilidade', label: 'Probabilidade (%)', external: '', required: false },
      { internal: 'responsavel', label: 'Responsável', external: '', required: false },
      { internal: 'qtd_colaboradores', label: 'Qtd. Colaboradores', external: '', required: false },
      { internal: 'forecast', label: 'Forecast', external: '', required: false },
    ]
  },
  {
    id: 'customer_care',
    name: 'Customer Care',
    description: 'Atendimento ao cliente e satisfação',
    color: '#8B5CF6',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data_atendimento', label: 'Data do Atendimento', external: '', required: true },
      { internal: 'hora_inicio', label: 'Hora Início', external: '', required: false },
      { internal: 'hora_fim', label: 'Hora Fim', external: '', required: false },
      { internal: 'tempo_resposta', label: 'Tempo de Resposta (min)', external: '', required: false },
      { internal: 'canal', label: 'Canal (WhatsApp, Email, etc)', external: '', required: true },
      { internal: 'motivo', label: 'Motivo do Contato', external: '', required: true },
      { internal: 'categoria', label: 'Categoria', external: '', required: false },
      { internal: 'aluno_id', label: 'ID do Aluno', external: '', required: false },
      { internal: 'atendente', label: 'Atendente', external: '', required: false },
      { internal: 'nps_score', label: 'NPS Score', external: '', required: false },
      { internal: 'csat_score', label: 'CSAT Score', external: '', required: false },
      { internal: 'resolvido', label: 'Resolvido (Sim/Não)', external: '', required: false },
    ]
  },
  {
    id: 'cancelamentos',
    name: 'Cancelamentos',
    description: 'Churn e motivos de cancelamento por curso',
    color: '#EF4444',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data_solicitacao', label: 'Data da Solicitação', external: '', required: true },
      { internal: 'data_efetivacao', label: 'Data da Efetivação', external: '', required: false },
      { internal: 'aluno_id', label: 'ID do Aluno', external: '', required: false },
      { internal: 'aluno_nome', label: 'Nome do Aluno', external: '', required: false },
      { internal: 'curso', label: 'Curso', external: '', required: true },
      { internal: 'motivo_principal', label: 'Motivo Principal', external: '', required: true },
      { internal: 'motivo_detalhado', label: 'Motivo Detalhado', external: '', required: false },
      { internal: 'valor_mensalidade', label: 'Valor da Mensalidade', external: '', required: false },
      { internal: 'tempo_como_aluno', label: 'Meses como Aluno', external: '', required: false },
      { internal: 'tentativa_retencao', label: 'Tentou Reter (Sim/Não)', external: '', required: false },
      { internal: 'feedback', label: 'Feedback do Aluno', external: '', required: false },
    ]
  },
  {
    id: 'cobranca',
    name: 'Cobrança',
    description: 'Inadimplência e recuperação de valores',
    color: '#F59E0B',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data_vencimento', label: 'Data de Vencimento', external: '', required: true },
      { internal: 'data_pagamento', label: 'Data de Pagamento', external: '', required: false },
      { internal: 'aluno_id', label: 'ID do Aluno', external: '', required: false },
      { internal: 'aluno_nome', label: 'Nome do Aluno', external: '', required: false },
      { internal: 'valor_devido', label: 'Valor Devido', external: '', required: true },
      { internal: 'valor_pago', label: 'Valor Pago', external: '', required: false },
      { internal: 'status', label: 'Status (Pago, Pendente, Atrasado)', external: '', required: true },
      { internal: 'dias_atraso', label: 'Dias em Atraso', external: '', required: false },
      { internal: 'acao_cobranca', label: 'Ação de Cobrança', external: '', required: false },
      { internal: 'responsavel', label: 'Responsável', external: '', required: false },
      { internal: 'curso', label: 'Curso', external: '', required: false },
    ]
  },
  {
    id: 'alunos_ativos',
    name: 'Alunos Ativos',
    description: 'Base de alunos ativos e receita por curso',
    color: '#06B6D4',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'aluno_id', label: 'ID do Aluno', external: '', required: true },
      { internal: 'aluno_nome', label: 'Nome do Aluno', external: '', required: true },
      { internal: 'email', label: 'E-mail', external: '', required: false },
      { internal: 'curso', label: 'Curso', external: '', required: true },
      { internal: 'data_matricula', label: 'Data da Matrícula', external: '', required: false },
      { internal: 'valor_mensalidade', label: 'Valor da Mensalidade', external: '', required: true },
      { internal: 'status', label: 'Status (Ativo, Trancado, Formado)', external: '', required: true },
      { internal: 'nivel', label: 'Nível', external: '', required: false },
      { internal: 'professor', label: 'Professor', external: '', required: false },
      { internal: 'horario', label: 'Horário', external: '', required: false },
      { internal: 'modalidade', label: 'Modalidade (Presencial/Online)', external: '', required: false },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Investimentos, CPL, CAC e performance de campanhas',
    color: '#EC4899',
    enabled: true,
    sourceUrl: '',
    sheetName: '',
    columns: [
      { internal: 'data', label: 'Data', external: '', required: true },
      { internal: 'plataforma', label: 'Plataforma (Google, Meta, etc)', external: '', required: true },
      { internal: 'campanha', label: 'Nome da Campanha', external: '', required: false },
      { internal: 'investimento', label: 'Investimento (R$)', external: '', required: true },
      { internal: 'impressoes', label: 'Impressões', external: '', required: false },
      { internal: 'cliques', label: 'Cliques', external: '', required: false },
      { internal: 'leads', label: 'Leads Gerados', external: '', required: true },
      { internal: 'leads_qualificados', label: 'Leads Qualificados', external: '', required: false },
      { internal: 'matriculas', label: 'Matrículas', external: '', required: false },
      { internal: 'receita_gerada', label: 'Receita Gerada', external: '', required: false },
      { internal: 'cpl', label: 'CPL', external: '', required: false },
      { internal: 'cac', label: 'CAC', external: '', required: false },
      { internal: 'roas', label: 'ROAS', external: '', required: false },
    ]
  },
];

const STORAGE_KEY = 'alumni_dashboard_config';

export default function ConfiguracoesPage() {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>('vendas_b2c');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | null>>({});

  // Carrega configurações salvas do localStorage ao iniciar
  useEffect(() => {
    const loadSavedConfig = () => {
      try {
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          // Merge com initialModules para garantir que novos campos existam
          const merged = getInitialModules().map(initialMod => {
            const savedMod = parsed.find((s: ModuleConfig) => s.id === initialMod.id);
            if (savedMod) {
              return {
                ...initialMod,
                ...savedMod,
                columns: initialMod.columns.map(initialCol => {
                  const savedCol = savedMod.columns?.find((c: { internal: string }) => c.internal === initialCol.internal);
                  return savedCol ? { ...initialCol, external: savedCol.external } : initialCol;
                })
              };
            }
            return initialMod;
          });
          setModules(merged);
        } else {
          setModules(getInitialModules());
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setModules(getInitialModules());
      }
      setLoading(false);
    };

    loadSavedConfig();
  }, []);

  const handleModuleChange = (moduleId: string, field: string, value: string | boolean) => {
    setModules(prev => prev.map(mod =>
      mod.id === moduleId ? { ...mod, [field]: value } : mod
    ));
    setSaved(false);
  };

  const handleColumnChange = (moduleId: string, columnInternal: string, value: string) => {
    setModules(prev => prev.map(mod =>
      mod.id === moduleId
        ? {
            ...mod,
            columns: mod.columns.map(col =>
              col.internal === columnInternal ? { ...col, external: value } : col
            )
          }
        : mod
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Salva no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));

      // Dispara evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: modules }));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    }

    setSaving(false);
  };

  const handleTestConnection = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module?.sourceUrl) {
      alert('Por favor, insira a URL da planilha primeiro');
      return;
    }

    setTestingConnection(moduleId);
    setConnectionStatus(prev => ({ ...prev, [moduleId]: null }));

    try {
      // Extrai ID da planilha
      const match = module.sourceUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error('URL inválida. Use a URL completa do Google Sheets.');
      }

      const sheetId = match[1];
      const sheetName = module.sheetName || 'Sheet1';
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

      const response = await fetch(exportUrl);

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 0) {
          setConnectionStatus(prev => ({ ...prev, [moduleId]: 'success' }));

          // Mostra preview das colunas encontradas
          const firstLine = text.split('\n')[0];
          const columns = firstLine.split(',').map(c => c.replace(/"/g, '').trim());
          alert(`Conexão OK!\n\nColunas encontradas:\n${columns.join('\n')}`);
        } else {
          throw new Error('Planilha vazia');
        }
      } else {
        throw new Error('Não foi possível acessar. Verifique se a planilha está pública.');
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [moduleId]: 'error' }));
      alert(`Erro: ${error instanceof Error ? error.message : 'Não foi possível conectar'}`);
    }

    setTestingConnection(null);
  };

  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-500">Configure as planilhas de cada módulo do dashboard</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <div className="flex gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Cole a <strong>URL completa</strong> da sua planilha Google Sheets</li>
                <li>Informe o <strong>nome da aba</strong> que contém os dados</li>
                <li>Mapeie as <strong>colunas</strong>: digite o nome exato como aparece na planilha</li>
                <li>Clique em <strong>"Testar"</strong> para verificar e ver as colunas disponíveis</li>
                <li>Clique em <strong>"Salvar Configurações"</strong></li>
              </ol>
              <p className="mt-3 text-blue-600">
                <strong>Importante:</strong> A planilha deve estar compartilhada como "Qualquer pessoa com o link pode ver"
              </p>
            </div>
          </div>
        </div>

        {/* Módulos */}
        <div className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Header do Módulo */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: module.color }}
                  />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{module.name}</h3>
                      {module.sourceUrl && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          Configurado
                        </span>
                      )}
                      {connectionStatus[module.id] === 'success' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Conectado
                        </span>
                      )}
                      {connectionStatus[module.id] === 'error' && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Erro
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={(e) => handleModuleChange(module.id, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Ativo</span>
                  </label>
                  {expandedModule === module.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Conteúdo expandido */}
              {expandedModule === module.id && (
                <div className="border-t border-gray-100 p-5 space-y-6">
                  {/* Fonte de dados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Link2 className="w-4 h-4" />
                        URL da Planilha Google Sheets *
                      </label>
                      <input
                        type="url"
                        value={module.sourceUrl}
                        onChange={(e) => handleModuleChange(module.id, 'sourceUrl', e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      {module.sourceUrl && extractSheetId(module.sourceUrl) && (
                        <p className="mt-1 text-xs text-green-600">
                          ID detectado: {extractSheetId(module.sourceUrl).substring(0, 20)}...
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Table className="w-4 h-4" />
                        Nome da Aba *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={module.sheetName}
                          onChange={(e) => handleModuleChange(module.id, 'sheetName', e.target.value)}
                          placeholder="Ex: Planilha1, Vendas, Dados..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={() => handleTestConnection(module.id)}
                          disabled={!module.sourceUrl || testingConnection === module.id}
                          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap flex items-center gap-2"
                        >
                          {testingConnection === module.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Testar'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {module.sourceUrl && (
                    <a
                      href={module.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir planilha no Google Sheets
                    </a>
                  )}

                  {/* Mapeamento de colunas */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Database className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">Mapeamento de Colunas</h4>
                      <span className="text-xs text-gray-400">
                        (Digite o nome exato da coluna na sua planilha)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {module.columns.map((column) => (
                        <div key={column.internal} className="relative">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {column.label}
                            {column.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            value={column.external}
                            onChange={(e) => handleColumnChange(module.id, column.internal, e.target.value)}
                            placeholder={`Nome da coluna`}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              column.required && !column.external
                                ? 'border-orange-200 bg-orange-50'
                                : column.external
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ajuda */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Preparando sua Planilha
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Estrutura recomendada:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Primeira linha com nomes das colunas</li>
                <li>Dados a partir da segunda linha</li>
                <li>Uma aba por módulo</li>
                <li>Datas no formato DD/MM/AAAA</li>
                <li>Valores sem R$, apenas números</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Como compartilhar:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra a planilha no Google Sheets</li>
                <li>Clique em "Compartilhar" (canto superior direito)</li>
                <li>Em "Acesso geral", selecione "Qualquer pessoa com o link"</li>
                <li>Mantenha como "Leitor"</li>
                <li>Copie o link e cole aqui</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
