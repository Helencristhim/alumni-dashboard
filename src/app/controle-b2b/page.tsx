'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/ui/KPICard';
import { DataSourceLink } from '@/components/ui/DataSourceLink';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ChevronDown,
  CalendarClock,
  RefreshCw,
  Sparkles,
  FileText,
  Receipt,
  Barcode,
  CreditCard,
  ClipboardList,
  CalendarRange,
  TrendingUp,
} from 'lucide-react';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function labelMes(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES_PT[m - 1]} ${y}`;
}

function mesAtualYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function labelNfAlerta(tipo: 'atrasado' | 'hoje' | 'proximo', dias: number): string {
  if (tipo === 'atrasado') return `${dias} dia(s) em atraso`;
  if (tipo === 'hoje') return 'emitir hoje';
  return `emitir em ${Math.abs(dias)} dia(s)`;
}

type StatusParcela = 'pago' | 'a_vencer' | 'atrasado' | 'aberto';

interface Parcela {
  numero: string;
  nf: string;
  dataEmissaoLabel: string | null;
  dataRecebimentoLabel: string | null;
  vencimentoLabel: string | null;
  vencimentoEstimado: boolean;
  valor: number;
  status: StatusParcela;
  diasAtraso: number | null;
  alunos: string;
}

interface Empresa {
  nome: string;
  marca: string | null;
  diaPagamento: number | null;
  ativo: boolean;
  encerrado: boolean;
  privado: boolean;
  observacoes: string[];
  cronograma: Cronograma | null;
  parcelas: Parcela[];
  totalRecebido: number;
  totalEmAberto: number;
  totalAtrasado: number;
  totalContratado: number;
  primeiraVenda: string | null;
  primeiraVendaLabel: string | null;
  primeiroValor: number;
  nfAlerta: NfAlerta | null;
  pagamentoAlerta: PagamentoAlerta | null;
}

type TipoNfAlerta = 'atrasado' | 'hoje' | 'proximo';

interface NfAlerta {
  tipo: TipoNfAlerta;
  diaEmissao: number;
  vencimentoEmissaoLabel: string;
  diasAtraso: number;
}

interface PagamentoAlerta {
  qtdParcelas: number;
  valorAtrasado: number;
  diasAtraso: number;
}

interface AlertaNf {
  empresa: string;
  marca: string | null;
  tipo: TipoNfAlerta;
  diaEmissao: number;
  diasAtraso: number;
  vencimentoEmissaoLabel: string;
}

interface AlertaPagamento {
  empresa: string;
  marca: string | null;
  qtdParcelas: number;
  valorAtrasado: number;
  diasAtraso: number;
}

interface VencimentoItem {
  empresa: string;
  marca: string | null;
  nf: string;
  valor: number;
  vencimentoLabel: string;
  status: 'atrasado' | 'a_vencer' | 'previsto';
  diasAtraso: number;
  estimado: boolean;
}

interface Resumo {
  totalRecebido: number;
  totalEmAberto: number;
  totalAtrasado: number;
  totalContratado: number;
  qtdEmpresas: number;
  qtdEmpresasAtivas: number;
  qtdAtrasadas: number;
  qtdNfAtrasada: number;
  qtdNfProxima: number;
  qtdPagamentoAtrasado: number;
}

interface ControleData {
  empresas: Empresa[];
  proximosVencimentos: VencimentoItem[];
  resumo: Resumo;
  alertasNf: AlertaNf[];
  alertasPagamento: AlertaPagamento[];
}

type TipoCronograma = 'relatorio' | 'pedido_compra' | 'nf' | 'boleto' | 'pagamento';

interface CronogramaItem {
  tipo: TipoCronograma;
  dia: string | null;
  detalhe?: string;
}

interface InvestimentoMes {
  ano: number;
  mes: string;
  valor: number;
}

interface Cronograma {
  itens: CronogramaItem[];
  observacoes: string[];
  investimento?: InvestimentoMes[];
  investimentoTotais?: { ano: number; valor: number }[];
}

// ---------- estilos de status ----------

const CRONO_META: Record<
  TipoCronograma,
  { label: string; icon: React.ReactNode; cor: string; bg: string }
> = {
  relatorio: { label: 'Relatório de Assiduidade', icon: <FileText className="w-4 h-4" />, cor: '#003080', bg: 'bg-blue-50' },
  pedido_compra: { label: 'Pedido de Compra', icon: <ClipboardList className="w-4 h-4" />, cor: '#6B7280', bg: 'bg-gray-100' },
  nf: { label: 'Nota Fiscal', icon: <Receipt className="w-4 h-4" />, cor: '#7C3AED', bg: 'bg-violet-50' },
  boleto: { label: 'Boleto', icon: <Barcode className="w-4 h-4" />, cor: '#D97706', bg: 'bg-amber-50' },
  pagamento: { label: 'Pagamento', icon: <CreditCard className="w-4 h-4" />, cor: '#059669', bg: 'bg-emerald-50' },
};

const STATUS_PARCELA: Record<StatusParcela, { label: string; cls: string }> = {
  pago: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  a_vencer: { label: 'A vencer', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  atrasado: { label: 'Atrasado', cls: 'bg-red-50 text-red-700 border-red-200' },
  aberto: { label: 'Em aberto', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function MarcaBadge({ marca }: { marca: string | null }) {
  if (!marca) return null;
  const isAlumni = marca === 'ALUMNI BY BETTER';
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: isAlumni ? '#003080' : '#d70c0c' }}
    >
      {marca}
    </span>
  );
}

function PrivateBadge({ privado }: { privado: boolean }) {
  if (!privado) return null;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
      100% Private
    </span>
  );
}

export default function ControleB2BPage() {
  const [data, setData] = useState<ControleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [investAberto, setInvestAberto] = useState<string | null>(null);
  const [mesNovas, setMesNovas] = useState<string>(mesAtualYM());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/data/controle-b2b?refresh=true&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data as ControleData);
        setSourceUrl(json.sourceUrl || '');
        setLastUpdated(new Date());
      } else {
        setError(json.error || 'Erro ao carregar dados.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // meses disponiveis (a partir da 1a venda de cada empresa) + mes atual, desc
  const mesesDisponiveis = (() => {
    const set = new Set<string>();
    set.add(mesAtualYM());
    data?.empresas.forEach((e) => {
      if (e.primeiraVenda) set.add(e.primeiraVenda.slice(0, 7));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  })();

  // empresas cuja PRIMEIRA venda caiu no mes selecionado = novas no mes
  const novasNoMes = data
    ? data.empresas
        .filter((e) => e.primeiraVenda && e.primeiraVenda.slice(0, 7) === mesNovas)
        .sort((a, b) => (a.primeiraVenda || '').localeCompare(b.primeiraVenda || ''))
    : [];

  const nfAtrasadas = data ? data.alertasNf.filter((a) => a.tipo === 'atrasado') : [];
  const nfProximas = data ? data.alertasNf.filter((a) => a.tipo !== 'atrasado') : [];

  const empresasOrdenadas = data
    ? [...data.empresas].sort((a, b) => {
        // ativas primeiro, depois maior em aberto, encerradas por ultimo
        if (a.encerrado !== b.encerrado) return a.encerrado ? 1 : -1;
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return b.totalEmAberto - a.totalEmAberto;
      })
    : [];

  return (
    <DashboardLayout
      title="Controle B2B"
      description="Faturamento, recebimentos e vencimentos por empresa"
    >
      {/* barra de fonte + refresh */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        {sourceUrl ? (
          <DataSourceLink url={sourceUrl} lastUpdated={lastUpdated || undefined} onRefresh={fetchData} loading={loading} />
        ) : (
          <div />
        )}
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {data && (
        <>
          {/* ALERTA: NOTAS FISCAIS EM ATRASO (vermelho) */}
          {nfAtrasadas.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl mb-4 overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2 border-b border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-semibold text-red-800">
                  {nfAtrasadas.length === 1
                    ? '1 Nota Fiscal em atraso'
                    : `${nfAtrasadas.length} Notas Fiscais em atraso`}
                </h2>
                <span className="text-xs text-red-500 ml-1">nenhum registro neste mês após o dia de emissão</span>
              </div>
              <div className="divide-y divide-red-100">
                {nfAtrasadas.map((a, i) => (
                  <div key={`${a.empresa}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{a.empresa}</span>
                    <MarcaBadge marca={a.marca} />
                    <span className="text-xs text-gray-500">emitir dia {a.diaEmissao}</span>
                    <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 rounded-full px-2.5 py-0.5">
                      {labelNfAlerta(a.tipo, a.diasAtraso)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALERTA: PAGAMENTOS NAO RECEBIDOS (vermelho) */}
          {data.alertasPagamento.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl mb-4 overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2 border-b border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-semibold text-red-800">
                  {data.alertasPagamento.length === 1
                    ? '1 Pagamento não recebido'
                    : `${data.alertasPagamento.length} Pagamentos não recebidos`}
                </h2>
                <span className="text-xs text-red-500 ml-1">nada na coluna recebimento após o dia de pagamento</span>
              </div>
              <div className="divide-y divide-red-100">
                {data.alertasPagamento.map((a, i) => (
                  <div key={`${a.empresa}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{a.empresa}</span>
                    <MarcaBadge marca={a.marca} />
                    <span className="text-xs text-gray-500">
                      {a.qtdParcelas} nota(s) sem pagamento
                    </span>
                    {a.valorAtrasado > 0 && (
                      <span className="text-xs font-semibold text-gray-800">{formatCurrency(a.valorAtrasado)}</span>
                    )}
                    <span className="text-xs font-semibold text-red-700 bg-red-100 border border-red-200 rounded-full px-2.5 py-0.5">
                      {a.diasAtraso} dia(s) em atraso
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEMBRETE: NOTAS FISCAIS A EMITIR (amarelo) */}
          {nfProximas.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl mb-8 overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2 border-b border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-semibold text-amber-800">
                  {nfProximas.length === 1
                    ? '1 Nota Fiscal a emitir em breve'
                    : `${nfProximas.length} Notas Fiscais a emitir em breve`}
                </h2>
                <span className="text-xs text-amber-600 ml-1">lembrete antes do prazo de emissão</span>
              </div>
              <div className="divide-y divide-amber-100">
                {nfProximas.map((a, i) => (
                  <div key={`${a.empresa}-${i}`} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{a.empresa}</span>
                    <MarcaBadge marca={a.marca} />
                    <span className="text-xs text-gray-500">emitir dia {a.diaEmissao}</span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-0.5">
                      {labelNfAlerta(a.tipo, a.diasAtraso)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Total Contratado"
              value={data.resumo.totalContratado}
              format="currency"
              icon={<DollarSign className="w-5 h-5" />}
              color="#003080"
              subtitle={`${data.resumo.qtdEmpresas} empresas`}
            />
            <KPICard
              title="Recebido"
              value={data.resumo.totalRecebido}
              format="currency"
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="#10B981"
              subtitle={`${data.resumo.qtdEmpresasAtivas} ativas`}
            />
            <KPICard
              title="Em Aberto"
              value={data.resumo.totalEmAberto}
              format="currency"
              icon={<Clock className="w-5 h-5" />}
              color="#F59E0B"
            />
            <KPICard
              title="Em Atraso"
              value={data.resumo.totalAtrasado}
              format="currency"
              icon={<AlertTriangle className="w-5 h-5" />}
              color="#d70c0c"
              subtitle={`${data.resumo.qtdAtrasadas} empresa(s)`}
            />
          </div>

          {/* NOVAS VENDAS NO MES */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Novas Vendas no Mês</h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {novasNoMes.length} nova(s)
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-400">Mês:</span>
                <select
                  value={mesNovas}
                  onChange={(e) => setMesNovas(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {mesesDisponiveis.map((m) => (
                    <option key={m} value={m}>
                      {labelMes(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {novasNoMes.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                Nenhuma empresa nova em {labelMes(mesNovas)}. Quando uma empresa for inserida na
                aba Controle e a primeira parcela cair neste mês, ela aparece aqui automaticamente.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {novasNoMes.map((e) => (
                  <div
                    key={e.nome}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50"
                    style={{ borderLeft: '3px solid #10B981' }}
                  >
                    <div className="w-24 shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{e.primeiraVendaLabel}</div>
                      <div className="text-xs text-emerald-600 font-medium">entrada</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{e.nome}</span>
                        <MarcaBadge marca={e.marca} />
                        <PrivateBadge privado={e.privado} />
                        {e.ativo && !e.encerrado && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(e.totalContratado)}</div>
                      <div className="text-xs text-gray-400">contratado</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROXIMOS VENCIMENTOS - secao principal */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Próximos Vencimentos</h2>
              <span className="text-xs text-gray-400 ml-1">
                atrasados + cobranças recorrentes previstas
              </span>
            </div>

            {data.proximosVencimentos.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">Nenhum vencimento em aberto identificado.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.proximosVencimentos.map((v, i) => {
                  const atrasado = v.status === 'atrasado';
                  const previsto = v.status === 'previsto';
                  return (
                    <div
                      key={`${v.empresa}-${i}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50"
                      style={{ borderLeft: `3px solid ${atrasado ? '#d70c0c' : previsto ? '#6366F1' : '#F59E0B'}` }}
                    >
                      <div className="w-24 shrink-0">
                        <div className="text-sm font-semibold text-gray-900">{v.vencimentoLabel}</div>
                        <div className={`text-xs ${atrasado ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          {v.diasAtraso > 0
                            ? `${v.diasAtraso}d em atraso`
                            : `em ${Math.abs(v.diasAtraso)}d`}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">{v.empresa}</span>
                          <MarcaBadge marca={v.marca} />
                          {v.nf && <span className="text-xs text-gray-400">NF {v.nf}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(v.valor)}</div>
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            atrasado
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : previsto
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {atrasado ? 'Atrasado' : previsto ? 'Previsto' : 'A vencer'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* POR EMPRESA */}
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Por Empresa</h2>
          </div>

          <div className="space-y-3">
            {empresasOrdenadas.map((e) => {
              const aberta = expandida === e.nome;
              const pct = e.totalContratado > 0 ? (e.totalRecebido / e.totalContratado) * 100 : 0;
              return (
                <div key={e.nome} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandida(aberta ? null : e.nome)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{e.nome}</span>
                        <MarcaBadge marca={e.marca} />
                        <PrivateBadge privado={e.privado} />
                        {e.encerrado && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            Encerrado
                          </span>
                        )}
                        {!e.encerrado && e.ativo && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        )}
                        {e.nfAlerta && e.nfAlerta.tipo === 'atrasado' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            NF em atraso
                          </span>
                        )}
                        {e.nfAlerta && e.nfAlerta.tipo !== 'atrasado' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            {e.nfAlerta.tipo === 'hoje' ? 'Emitir NF hoje' : 'Emitir NF em breve'}
                          </span>
                        )}
                        {e.pagamentoAlerta && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            Pagamento não recebido
                          </span>
                        )}
                        {e.diaPagamento && (
                          <span className="text-xs text-gray-400">vence dia {e.diaPagamento}</span>
                        )}
                      </div>
                      {/* barra de progresso recebido/contratado */}
                      <div className="mt-2 h-1.5 w-full max-w-md bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
                      <div>
                        <div className="text-[11px] text-gray-400">Recebido</div>
                        <div className="text-sm font-semibold text-emerald-600">{formatCurrency(e.totalRecebido)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400">Em aberto</div>
                        <div className="text-sm font-semibold text-amber-600">{formatCurrency(e.totalEmAberto)}</div>
                      </div>
                      {e.totalAtrasado > 0 && (
                        <div>
                          <div className="text-[11px] text-gray-400">Atrasado</div>
                          <div className="text-sm font-semibold text-red-600">{formatCurrency(e.totalAtrasado)}</div>
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${aberta ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {aberta && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                      {/* CRONOGRAMA OPERACIONAL DO MES */}
                      {e.cronograma && (
                        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarRange className="w-4 h-4 text-gray-500" />
                            <h4 className="text-sm font-semibold text-gray-900">Cronograma do mês</h4>
                          </div>
                          <ul className="space-y-2">
                            {e.cronograma.itens.map((it, idx) => {
                              const meta = CRONO_META[it.tipo];
                              const alertaNf = it.tipo === 'nf' ? e.nfAlerta : null;
                              const atrasada = alertaNf?.tipo === 'atrasado';
                              const lembrete = !!alertaNf && !atrasada;
                              const corAlerta = atrasada ? '#dc2626' : '#d97706';
                              return (
                                <li key={idx} className="flex items-center gap-3">
                                  <span
                                    className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${atrasada ? 'bg-red-50' : lembrete ? 'bg-amber-50' : meta.bg}`}
                                    style={{ color: alertaNf ? corAlerta : meta.cor }}
                                  >
                                    {meta.icon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-800">{meta.label}</span>
                                    {it.detalhe && (
                                      <span className="block text-xs text-gray-400">{it.detalhe}</span>
                                    )}
                                    {alertaNf && (
                                      <span
                                        className="block text-xs font-medium"
                                        style={{ color: corAlerta }}
                                      >
                                        {atrasada
                                          ? `Em atraso há ${alertaNf.diasAtraso} dia(s) — nada registrado neste mês`
                                          : alertaNf.tipo === 'hoje'
                                          ? 'Emitir hoje — ainda sem registro neste mês'
                                          : `Emitir em ${Math.abs(alertaNf.diasAtraso)} dia(s) — ainda sem registro neste mês`}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                                    style={
                                      alertaNf
                                        ? { backgroundColor: atrasada ? '#fee2e2' : '#fef3c7', color: corAlerta }
                                        : { backgroundColor: `${meta.cor}14`, color: meta.cor }
                                    }
                                  >
                                    {it.dia ? `dia ${it.dia}` : 'a confirmar'}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>

                          {e.cronograma.observacoes.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1">
                              {e.cronograma.observacoes.map((o, idx) => (
                                <span key={idx} className="text-xs text-gray-500 flex items-center gap-1.5">
                                  <span className="text-gray-400">ⓘ</span>
                                  {o}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Plano de investimento (Racional) - expansivel */}
                          {e.cronograma.investimento && e.cronograma.investimento.length > 0 && (
                            <div className="mt-4 border-t border-gray-100 pt-3">
                              <button
                                onClick={() => setInvestAberto(investAberto === e.nome ? null : e.nome)}
                                className="w-full flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
                              >
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                Plano de investimento
                                <span className="text-xs text-gray-400 font-normal">
                                  {e.cronograma.investimentoTotais
                                    ?.map((t) => `${t.ano}: ${formatCurrency(t.valor)}`)
                                    .join(' · ')}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${
                                    investAberto === e.nome ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {investAberto === e.nome && (
                                <div className="mt-3 overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                                        <th className="py-2 pr-3 font-medium">Ano</th>
                                        <th className="py-2 pr-3 font-medium">Mês</th>
                                        <th className="py-2 pr-3 font-medium text-right">Valor</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {e.cronograma.investimento.map((m, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                                          <td className="py-1.5 pr-3 text-gray-500">{m.ano}</td>
                                          <td className="py-1.5 pr-3 text-gray-700">{m.mes}</td>
                                          <td className="py-1.5 pr-3 text-right font-medium text-gray-900">
                                            {formatCurrency(m.valor)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    {e.cronograma.investimentoTotais && (
                                      <tfoot>
                                        {e.cronograma.investimentoTotais.map((t, idx) => (
                                          <tr key={idx} className="border-t border-gray-200">
                                            <td colSpan={2} className="py-1.5 pr-3 font-semibold text-gray-700">
                                              Total {t.ano}
                                            </td>
                                            <td className="py-1.5 pr-3 text-right font-bold" style={{ color: '#003080' }}>
                                              {formatCurrency(t.valor)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tfoot>
                                    )}
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {e.observacoes.length > 0 && (
                        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          {e.observacoes.map((o, idx) => (
                            <div key={idx}>{o}</div>
                          ))}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                              <th className="py-2 pr-3 font-medium">#</th>
                              <th className="py-2 pr-3 font-medium">NF</th>
                              <th className="py-2 pr-3 font-medium">Valor</th>
                              <th className="py-2 pr-3 font-medium">Emissão</th>
                              <th className="py-2 pr-3 font-medium">Recebimento</th>
                              <th className="py-2 pr-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {e.parcelas.map((p, idx) => {
                              const st = STATUS_PARCELA[p.status];
                              return (
                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                  <td className="py-2 pr-3 text-gray-500">{p.numero}</td>
                                  <td className="py-2 pr-3 text-gray-500">{p.nf || '—'}</td>
                                  <td className="py-2 pr-3 font-medium text-gray-900">{formatCurrency(p.valor)}</td>
                                  <td className="py-2 pr-3 text-gray-600">{p.dataEmissaoLabel || '—'}</td>
                                  <td className="py-2 pr-3 text-gray-600">
                                    {p.dataRecebimentoLabel
                                      ? p.dataRecebimentoLabel
                                      : p.vencimentoLabel
                                      ? `vence ${p.vencimentoLabel}`
                                      : '—'}
                                  </td>
                                  <td className="py-2 pr-3">
                                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
                                      {st.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Status calculado pelas datas da aba Controle: com data de recebimento = pago; sem data e vencimento futuro = a vencer;
            sem data e vencimento passado = atrasado. &quot;Previsto&quot; = cobrança recorrente estimada pelo dia de pagamento da empresa.
          </p>
        </>
      )}
    </DashboardLayout>
  );
}
