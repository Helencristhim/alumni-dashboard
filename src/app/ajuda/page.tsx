'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  HelpCircle,
  FileSpreadsheet,
  Link2,
  Database,
  RefreshCw,
  Lock,
  Mail,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function AjudaPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
            <p className="text-gray-500">Guia completo para usar o Dashboard Alumni</p>
          </div>
        </div>

        {/* Início Rápido */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Início Rápido
          </h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex gap-4">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
              <div>
                <p className="font-medium text-gray-900">Acesse as Configurações</p>
                <p className="text-sm">Clique em "Configurações" no menu lateral</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
              <div>
                <p className="font-medium text-gray-900">Configure suas planilhas</p>
                <p className="text-sm">Cole a URL do Google Sheets e mapeie as colunas</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
              <div>
                <p className="font-medium text-gray-900">Teste a conexão</p>
                <p className="text-sm">Clique em "Testar" para verificar se a planilha está acessível</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
              <div>
                <p className="font-medium text-gray-900">Salve e visualize</p>
                <p className="text-sm">Clique em "Salvar" e acesse os módulos para ver seus dados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Como preparar planilhas */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Como Preparar suas Planilhas
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Estrutura da Planilha</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Aluno</th>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-left">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-t">
                      <td className="px-3 py-2">22/01/2024</td>
                      <td className="px-3 py-2">João Silva</td>
                      <td className="px-3 py-2">Particular Online</td>
                      <td className="px-3 py-2">1500</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2">23/01/2024</td>
                      <td className="px-3 py-2">Maria Santos</td>
                      <td className="px-3 py-2">Community</td>
                      <td className="px-3 py-2">800</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul className="mt-3 text-sm text-gray-600 space-y-1">
                <li>• <strong>Linha 1:</strong> Nomes das colunas (cabeçalho)</li>
                <li>• <strong>Linha 2+:</strong> Seus dados</li>
                <li>• <strong>Datas:</strong> Formato DD/MM/AAAA</li>
                <li>• <strong>Valores:</strong> Apenas números (sem R$, sem pontos de milhar)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Como Compartilhar o Google Sheets</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">1.</span>
                  Abra sua planilha no Google Sheets
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">2.</span>
                  Clique no botão <strong>"Compartilhar"</strong> (canto superior direito)
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">3.</span>
                  Em "Acesso geral", clique e selecione <strong>"Qualquer pessoa com o link"</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">4.</span>
                  Mantenha a permissão como <strong>"Leitor"</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">5.</span>
                  Copie o link completo da URL do navegador
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Mapeamento de Colunas */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Mapeamento de Colunas
          </h2>

          <div className="space-y-4 text-gray-600">
            <p>
              O mapeamento conecta os campos do dashboard com as colunas da sua planilha.
              Você precisa informar o <strong>nome exato</strong> da coluna como aparece na planilha.
            </p>

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Atenção com maiúsculas e espaços!</p>
                  <p className="mt-1">
                    Se na planilha a coluna se chama "Data da Venda", você deve digitar exatamente
                    "Data da Venda" (não "data da venda" ou "Data_da_Venda").
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Exemplo de Mapeamento</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 mb-1">Campo do Dashboard</p>
                    <p className="font-mono bg-white px-2 py-1 rounded">Data da Venda</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Nome na sua Planilha</p>
                    <p className="font-mono bg-white px-2 py-1 rounded border-2 border-blue-300">Data</p>
                  </div>
                </div>
                <p className="mt-3 text-gray-500">
                  → Se sua coluna se chama "Data", digite "Data" no campo correspondente
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Os 7 Módulos do Dashboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Vendas B2C', desc: 'Faturamento, matrículas por produto, ticket médio', color: '#10B981' },
              { name: 'Vendas B2B', desc: 'Contratos corporativos, pipeline, forecast', color: '#3B82F6' },
              { name: 'Customer Care', desc: 'NPS, CSAT, volume de atendimentos', color: '#8B5CF6' },
              { name: 'Cancelamentos', desc: 'Taxa de churn, motivos por curso', color: '#EF4444' },
              { name: 'Cobrança', desc: 'Inadimplência, valor recuperado', color: '#F59E0B' },
              { name: 'Alunos Ativos', desc: 'Base por curso, receita recorrente', color: '#06B6D4' },
              { name: 'Marketing', desc: 'Investimento, CPL, CAC por plataforma', color: '#EC4899' },
            ].map((mod) => (
              <div key={mod.name} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: mod.color }} />
                <div>
                  <p className="font-medium text-gray-900">{mod.name}</p>
                  <p className="text-sm text-gray-500">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Credenciais */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            Acesso ao Dashboard
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              Credenciais de demonstração para acesso:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>investidor@alumni.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>Alumni@2024</span>
              </div>
            </div>
          </div>
        </section>

        {/* Atualização de Dados */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-cyan-600" />
            Atualização de Dados
          </h2>

          <div className="space-y-3 text-gray-600">
            <p>
              Os dados são atualizados automaticamente a cada <strong>15 minutos</strong>.
            </p>
            <p>
              Para forçar atualização imediata, clique no botão <strong>"Atualizar"</strong>
              que aparece ao lado do link da planilha em cada módulo.
            </p>
            <p>
              Quando você altera dados na planilha do Google Sheets, as mudanças
              aparecem no dashboard na próxima atualização.
            </p>
          </div>
        </section>

        {/* Suporte */}
        <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Precisa de mais ajuda?</h2>
          <p className="text-blue-100 mb-4">
            Entre em contato com o suporte técnico para assistência personalizada.
          </p>
          <a
            href="mailto:suporte@alumni.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            suporte@alumni.com
          </a>
        </section>
      </div>
    </DashboardLayout>
  );
}
