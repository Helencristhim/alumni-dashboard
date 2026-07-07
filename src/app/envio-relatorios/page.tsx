'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import {
  Mail,
  MailCheck,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Paperclip,
  Clock,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';

type TipoEnvio = 'relatorio' | 'alerta' | 'teste';

interface RelatorioEnviado {
  uid: string;
  data: string;
  to: string[];
  cc: string[];
  subject: string;
  tipo: TipoEnvio;
  anexo: boolean;
}

interface ApiResponse {
  success: boolean;
  items: RelatorioEnviado[];
  totais: {
    total: number;
    relatorios: number;
    alertas: number;
    ultimoEnvio: string | null;
    ultimoTipo: TipoEnvio | null;
    ultimoDestino: string[];
  };
  lastChecked: string;
  error?: string;
}

const AZUL = '#003080';
const VERMELHO = '#d70c0c';

function fmtDataHora(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDataCurta(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function diasAtras(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(ms / 86400000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

function TipoBadge({ tipo }: { tipo: TipoEnvio }) {
  if (tipo === 'relatorio') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Relatório enviado
      </span>
    );
  }
  if (tipo === 'alerta') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        Alerta de falha
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
      <FlaskConical className="w-3.5 h-3.5" />
      Teste
    </span>
  );
}

export default function EnvioRelatoriosPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/data/envio-relatorios?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const result: ApiResponse = await response.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Erro ao carregar os envios');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Atualiza sozinho a cada 2 minutos para manter sempre fresco
    const id = setInterval(fetchData, 120000);
    return () => clearInterval(id);
  }, [fetchData]);

  const totais = data?.totais;
  const items = data?.items || [];

  const ultimoLabel = totais?.ultimoEnvio
    ? `${fmtDataCurta(totais.ultimoEnvio)} (${diasAtras(totais.ultimoEnvio)})`
    : '—';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Envio de Relatórios</h1>
            <p className="text-gray-500 mt-1">
              Histórico real dos e-mails do dashboard de vendas, lido direto da caixa de
              enviados.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: AZUL }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Indicador de frescor */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {loading && !data ? (
            <span>Consultando a caixa de e-mail...</span>
          ) : data ? (
            <span>
              Atualizado em <strong className="text-gray-700">{fmtDataHora(data.lastChecked)}</strong>{' '}
              · atualiza sozinho a cada 2 min
            </span>
          ) : (
            <span>—</span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Aviso quando o último envio foi um alerta de falha */}
        {totais?.ultimoTipo === 'alerta' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              O envio mais recente foi um <strong>alerta de falha</strong> — o último relatório
              pode não ter sido entregue. Verifique a rotina.
            </span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Relatórios Enviados"
            value={totais?.relatorios ?? 0}
            format="number"
            icon={<MailCheck className="w-5 h-5" />}
            color={AZUL}
            loading={loading && !data}
          />
          <KPICard
            title="Último Envio"
            value={ultimoLabel}
            format="text"
            icon={<Clock className="w-5 h-5" />}
            color="#10B981"
            loading={loading && !data}
          />
          <KPICard
            title="Alertas de Falha"
            value={totais?.alertas ?? 0}
            format="number"
            icon={<AlertTriangle className="w-5 h-5" />}
            color={VERMELHO}
            loading={loading && !data}
          />
          <KPICard
            title="Total de Registros"
            value={totais?.total ?? 0}
            format="number"
            icon={<Mail className="w-5 h-5" />}
            color="#6366F1"
            loading={loading && !data}
          />
        </div>

        {/* Tabela de envios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="p-4 border-b border-gray-100"
            style={{ backgroundColor: `${AZUL}0D` }}
          >
            <h3 className="font-semibold text-gray-900">Histórico de envios</h3>
          </div>

          {loading && !data ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum envio encontrado na caixa de e-mail.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Data e hora</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium">Destinatários</th>
                    <th className="px-4 py-3 font-medium">Assunto</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-center">Anexo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.uid}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                        {fmtDataHora(item.data)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <TipoBadge tipo={item.tipo} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{item.to.join(', ') || '—'}</div>
                        {item.cc.length > 0 && (
                          <div className="text-xs text-gray-400">
                            CC: {item.cc.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={item.subject}>
                        {item.subject}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.anexo ? (
                          <Paperclip
                            className="w-4 h-4 inline"
                            style={{ color: AZUL }}
                            aria-label="Com anexo"
                          />
                        ) : (
                          <span className="text-gray-300" aria-label="Sem anexo">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Fonte: pasta de Enviados de helen.mendes@betteredu.com.br (IMAP). Só aparece aqui o
          que realmente saiu da conta.
        </p>
      </div>
    </DashboardLayout>
  );
}
