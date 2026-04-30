'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Calculator,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Ban,
  DollarSign,
  CalendarDays,
  User,
  BookOpen,
} from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

interface AlunoVenda {
  nome: string;
  email: string;
  data_venda: string;
  ultima_parcela: string;
  produto: string;
  fonte: string;
  renovacao: string;
  duracao_curso: string;
  parcelas: string;
  valor_total: string;
  valor_produto: string;
  valor_servico: string;
  forma_pagamento: string;
  cancelamento: string;
}

interface ResultadoCalculo {
  id: string;
  timestamp: string;
  // Dados do aluno
  nome: string;
  email: string;
  produto: string;
  // Dados de entrada
  valor_total_contrato: number;
  valor_produto: number;
  valor_servico: number;
  quantidade_total_meses: number;
  meses_utilizados: number;
  meses_restantes: number;
  tipo_pagamento: 'recorrente' | 'parcelado' | 'avista';
  data_compra: string;
  data_cancelamento: string;
  // Resultado
  dentro_7_dias: boolean;
  dias_desde_compra: number;
  valor_mensal: number;
  valor_utilizado: number;
  valor_restante_servico: number;
  multa: number;
  estorno: number;
  parcelas_restantes: number;
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function parseValor(valor: string): number {
  if (!valor) return 0;
  let limpo = valor.replace(/R\$\s*/gi, '').trim();
  if (limpo.includes(',') && limpo.includes('.')) {
    const lastComma = limpo.lastIndexOf(',');
    const lastDot = limpo.lastIndexOf('.');
    if (lastComma > lastDot) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else {
      limpo = limpo.replace(/,/g, '');
    }
  } else if (limpo.includes(',') && !limpo.includes('.')) {
    limpo = limpo.replace(',', '.');
  }
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    let year = parseInt(parts[2]);
    if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateBR(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateInput(dateStr: string): string {
  const date = parseDateStr(dateStr);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDuracao(duracao: string): number {
  if (!duracao) return 0;
  const num = parseInt(duracao.replace(/[^\d]/g, ''));
  return isNaN(num) ? 0 : num;
}

function diffDays(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function diffMonths(dateStart: Date, dateEnd: Date): number {
  const months = (dateEnd.getFullYear() - dateStart.getFullYear()) * 12 + (dateEnd.getMonth() - dateStart.getMonth());
  return Math.max(0, months);
}

// LocalStorage helpers
function getHistorico(): ResultadoCalculo[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('calculadora-cancelamentos-historico');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistorico(historico: ResultadoCalculo[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('calculadora-cancelamentos-historico', JSON.stringify(historico));
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CalculadoraCancelamentosPage() {
  // Estado de busca
  const [emailBusca, setEmailBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<AlunoVenda[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoVenda | null>(null);

  // Estado do formulário
  const [valorTotalContrato, setValorTotalContrato] = useState('');
  const [valorProduto, setValorProduto] = useState('');
  const [valorServico, setValorServico] = useState('');
  const [quantidadeTotalMeses, setQuantidadeTotalMeses] = useState('');
  const [mesesUtilizados, setMesesUtilizados] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState<'recorrente' | 'parcelado' | 'avista'>('parcelado');
  const [dataCompra, setDataCompra] = useState('');
  const [dataCancelamento, setDataCancelamento] = useState('');

  // Estado do resultado
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [erroCalculo, setErroCalculo] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Histórico
  const [historico, setHistorico] = useState<ResultadoCalculo[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  useEffect(() => {
    setHistorico(getHistorico());
  }, []);

  // ============================================================
  // BUSCAR ALUNO POR EMAIL
  // ============================================================
  const buscarAluno = async () => {
    if (!emailBusca.trim()) {
      setErroBusca('Digite um email para buscar.');
      return;
    }

    setBuscando(true);
    setErroBusca('');
    setResultadosBusca([]);
    setAlunoSelecionado(null);
    setResultado(null);

    try {
      const res = await fetch(`/api/data/calculadora-busca?email=${encodeURIComponent(emailBusca.trim())}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!json.success) {
        setErroBusca(json.error || 'Erro na busca.');
        return;
      }

      if (!json.data || json.data.length === 0) {
        setErroBusca('Nenhum aluno encontrado com esse email.');
        return;
      }

      setResultadosBusca(json.data);

      // Se só tem 1 resultado, seleciona automaticamente
      if (json.data.length === 1) {
        selecionarAluno(json.data[0]);
      }
    } catch (err) {
      setErroBusca('Erro ao conectar com a API. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  // ============================================================
  // SELECIONAR ALUNO E PRÉ-PREENCHER FORMULÁRIO
  // ============================================================
  const selecionarAluno = (aluno: AlunoVenda) => {
    setAlunoSelecionado(aluno);
    setResultado(null);
    setErroCalculo('');

    const vTotal = parseValor(aluno.valor_total);
    const vProduto = parseValor(aluno.valor_produto);
    const vServico = parseValor(aluno.valor_servico);

    setValorTotalContrato(vTotal > 0 ? vTotal.toFixed(2) : '');
    setValorProduto(vProduto > 0 ? vProduto.toFixed(2) : '');
    setValorServico(vServico > 0 ? vServico.toFixed(2) : '');

    const duracao = parseDuracao(aluno.duracao_curso);
    setQuantidadeTotalMeses(duracao > 0 ? String(duracao) : '');

    // Calcular meses utilizados automaticamente
    const dataVenda = parseDateStr(aluno.data_venda);
    if (dataVenda) {
      setDataCompra(formatDateInput(aluno.data_venda));
      const hoje = new Date();
      const meses = diffMonths(dataVenda, hoje);
      setMesesUtilizados(String(Math.min(meses, duracao || 999)));
    } else {
      setDataCompra('');
      setMesesUtilizados('');
    }

    // Data cancelamento = hoje por padrão
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    setDataCancelamento(`${y}-${m}-${d}`);

    // Determinar tipo de pagamento baseado na coluna "forma" da planilha
    // Valores possíveis: Parcelado, Recorrência, À vista, Pix
    const forma = (aluno.forma_pagamento || '').toLowerCase().trim();
    if (forma === 'recorrência' || forma === 'recorrencia' || forma.includes('recorr')) {
      setTipoPagamento('recorrente');
    } else if (forma === 'à vista' || forma === 'a vista' || forma === 'pix') {
      setTipoPagamento('avista');
    } else {
      setTipoPagamento('parcelado');
    }
  };

  // ============================================================
  // CALCULAR
  // ============================================================
  const calcular = () => {
    setErroCalculo('');
    setResultado(null);

    // Validações
    const vTotal = parseFloat(valorTotalContrato);
    const vProduto = parseFloat(valorProduto);
    const vServico = parseFloat(valorServico);
    const qtdMeses = parseInt(quantidadeTotalMeses);
    const mesesUsados = parseInt(mesesUtilizados);

    if (isNaN(vTotal) || vTotal <= 0) {
      setErroCalculo('Valor total do contrato inválido.');
      return;
    }
    if (isNaN(qtdMeses) || qtdMeses <= 0) {
      setErroCalculo('Quantidade total de meses inválida.');
      return;
    }
    if (isNaN(mesesUsados) || mesesUsados < 0) {
      setErroCalculo('Meses utilizados inválido.');
      return;
    }
    if (mesesUsados > qtdMeses) {
      setErroCalculo('Meses utilizados não pode ser maior que a quantidade total de meses.');
      return;
    }
    if (!dataCompra) {
      setErroCalculo('Data da compra é obrigatória.');
      return;
    }
    if (!dataCancelamento) {
      setErroCalculo('Data do cancelamento é obrigatória.');
      return;
    }

    const dateCompra = new Date(dataCompra + 'T00:00:00');
    const dateCancel = new Date(dataCancelamento + 'T00:00:00');
    const dias = diffDays(dateCompra, dateCancel);

    if (dias < 0) {
      setErroCalculo('Data de cancelamento não pode ser anterior à data da compra.');
      return;
    }

    // Usar valores informados ou calcular 50/50
    const produtoVal = !isNaN(vProduto) && vProduto > 0 ? vProduto : vTotal / 2;
    const servicoVal = !isNaN(vServico) && vServico > 0 ? vServico : vTotal / 2;
    const mesesRestantes = qtdMeses - mesesUsados;

    let multa = 0;
    let estorno = 0;
    let valorMensal = 0;
    let valorUtilizado = 0;
    let valorRestanteServico = 0;
    let parcelasRestantes = 0;
    let dentro7Dias = false;

    // PASSO 1 — Verificar prazo de 7 dias
    if (dias <= 7) {
      dentro7Dias = true;
      estorno = vTotal;
      multa = 0;
    } else {
      // PASSO 2 — Após 7 dias
      valorMensal = servicoVal / qtdMeses;
      valorUtilizado = mesesUsados * valorMensal;
      valorRestanteServico = servicoVal - valorUtilizado;

      if (tipoPagamento === 'recorrente') {
        // CASO 2 — Recorrente
        parcelasRestantes = mesesRestantes;
        valorRestanteServico = parcelasRestantes * valorMensal;
        multa = valorRestanteServico * 0.10;
        estorno = 0; // NÃO existe estorno para recorrente
      } else {
        // CASO 1 — À vista ou parcelado
        multa = valorRestanteServico * 0.10;
        estorno = valorRestanteServico - multa;
      }
    }

    const res: ResultadoCalculo = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      nome: alunoSelecionado?.nome || '',
      email: alunoSelecionado?.email || emailBusca,
      produto: alunoSelecionado?.produto || '',
      valor_total_contrato: vTotal,
      valor_produto: produtoVal,
      valor_servico: servicoVal,
      quantidade_total_meses: qtdMeses,
      meses_utilizados: mesesUsados,
      meses_restantes: mesesRestantes,
      tipo_pagamento: tipoPagamento,
      data_compra: formatDateBR(dateCompra),
      data_cancelamento: formatDateBR(dateCancel),
      dentro_7_dias: dentro7Dias,
      dias_desde_compra: dias,
      valor_mensal: valorMensal,
      valor_utilizado: valorUtilizado,
      valor_restante_servico: valorRestanteServico,
      multa,
      estorno,
      parcelas_restantes: parcelasRestantes,
    };

    setResultado(res);

    // Salvar no histórico
    const novoHistorico = [res, ...historico].slice(0, 50);
    setHistorico(novoHistorico);
    saveHistorico(novoHistorico);
  };

  // ============================================================
  // GERAR TEXTO DO RESULTADO
  // ============================================================
  const gerarTextoResultado = (r: ResultadoCalculo): string => {
    if (r.dentro_7_dias) {
      return [
        `Data da matrícula: ${r.data_compra} (Valor total ${formatCurrency(r.valor_total_contrato)})`,
        `Data da solicitação: ${r.data_cancelamento}`,
        ``,
        `Cancelamento dentro do prazo de 7 dias (${r.dias_desde_compra} dias).`,
        `Direito de arrependimento — reembolso integral.`,
        ``,
        `Ações:`,
        `Estornar o valor integral de R$ ${formatCurrency(r.estorno)}`,
        `Sem multa aplicável.`,
      ].join('\n');
    }

    if (r.tipo_pagamento === 'recorrente') {
      return [
        `Data da matrícula: ${r.data_compra} (Valor total ${formatCurrency(r.valor_total_contrato)})`,
        `Data da solicitação: ${r.data_cancelamento}`,
        ``,
        `Meses utilizados: ${r.meses_utilizados}`,
        `Meses restantes: ${r.meses_restantes}`,
        ``,
        `Serviço - ${formatCurrency(r.valor_servico)} = ${r.meses_utilizados} parcelas já pagas - ${r.meses_restantes} x ${formatCurrency(r.valor_mensal)} = ${formatCurrency(r.valor_restante_servico)} - Multa 10% (${formatCurrency(r.multa)})`,
        `Produto - ${formatCurrency(r.valor_produto)} - Não cancelável`,
        ``,
        `Ações:`,
        `As cobranças futuras (${r.parcelas_restantes} parcelas) serão canceladas.`,
        `Valor devido referente à multa: R$ ${formatCurrency(r.multa)}`,
        `Material permanece a cobrança conforme informado em contrato`,
      ].join('\n');
    }

    // À vista ou parcelado
    return [
      `Data da matrícula: ${r.data_compra} (Valor total ${formatCurrency(r.valor_total_contrato)})`,
      `Data da solicitação: ${r.data_cancelamento}`,
      ``,
      `Meses utilizados: ${r.meses_utilizados}`,
      `Meses restantes: ${r.meses_restantes}`,
      ``,
      `Serviço - ${formatCurrency(r.valor_servico)} = ${r.meses_utilizados} parcelas já pagas - ${r.meses_restantes} x ${formatCurrency(r.valor_mensal)} = ${formatCurrency(r.valor_restante_servico)} - Multa 10% (${formatCurrency(r.multa)})`,
      `Produto - ${formatCurrency(r.valor_produto)} - Não cancelável`,
      ``,
      `Ações:`,
      `Estornar o valor de R$ ${formatCurrency(r.estorno)} (valor estornado já abate a multa de 10% - R$ ${formatCurrency(r.multa)})`,
      `Material permanece a cobrança conforme informado em contrato`,
    ].join('\n');
  };

  const copiarResultado = (r: ResultadoCalculo) => {
    navigator.clipboard.writeText(gerarTextoResultado(r));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const removerDoHistorico = (id: string) => {
    const novo = historico.filter(h => h.id !== id);
    setHistorico(novo);
    saveHistorico(novo);
  };

  const limparHistorico = () => {
    setHistorico([]);
    saveHistorico([]);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
              <Calculator className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calculadora de Cancelamentos</h1>
              <p className="text-sm text-gray-500">Cálculo de estorno e multa conforme Termos e Condições</p>
            </div>
          </div>
        </div>

        {/* Busca por Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            Buscar Aluno
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Digite o email do aluno..."
              value={emailBusca}
              onChange={(e) => setEmailBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarAluno()}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              onClick={buscarAluno}
              disabled={buscando}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>

          {erroBusca && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erroBusca}
            </div>
          )}

          {/* Múltiplos resultados */}
          {resultadosBusca.length > 1 && !alunoSelecionado && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">{resultadosBusca.length} matrículas encontradas. Selecione:</p>
              {resultadosBusca.map((aluno, idx) => (
                <button
                  key={idx}
                  onClick={() => selecionarAluno(aluno)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{aluno.nome}</span>
                      <span className="text-gray-500 mx-2">—</span>
                      <span className="text-sm text-gray-600">{aluno.produto}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {aluno.data_venda && `Matrícula: ${aluno.data_venda}`}
                      {aluno.valor_total && ` | R$ ${aluno.valor_total}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dados do Aluno Selecionado */}
        {alunoSelecionado && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Dados do Aluno
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Nome</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.nome || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Produto</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.produto || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Data Venda</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.data_venda || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fonte</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.fonte || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Renovação</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.renovacao || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Forma Pagamento</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.forma_pagamento || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Duração</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{alunoSelecionado.duracao_curso || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário de Cálculo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Dados do Cancelamento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Valor Total */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Valor Total do Contrato (R$)
              </label>
              <input
                type="text"
                value={valorTotalContrato}
                onChange={(e) => setValorTotalContrato(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Valor Produto (Material) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                Valor Produto / Material (R$)
              </label>
              <input
                type="text"
                value={valorProduto}
                onChange={(e) => setValorProduto(e.target.value)}
                placeholder="50% do contrato se vazio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Valor Serviço */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Valor Serviço / Aulas (R$)
              </label>
              <input
                type="text"
                value={valorServico}
                onChange={(e) => setValorServico(e.target.value)}
                placeholder="50% do contrato se vazio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Quantidade Total Meses */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                Duração do Contrato (meses)
              </label>
              <input
                type="number"
                value={quantidadeTotalMeses}
                onChange={(e) => setQuantidadeTotalMeses(e.target.value)}
                min="1"
                placeholder="Ex: 12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Meses Utilizados */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Meses Utilizados
              </label>
              <input
                type="number"
                value={mesesUtilizados}
                onChange={(e) => setMesesUtilizados(e.target.value)}
                min="0"
                placeholder="Ex: 9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Tipo Pagamento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Tipo de Pagamento
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 font-medium">
                {tipoPagamento === 'recorrente' ? 'Recorrência' : tipoPagamento === 'avista' ? 'À Vista / Pix' : 'Parcelado'}
              </div>
            </div>

            {/* Data da Compra */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                Data da Matrícula
              </label>
              <input
                type="date"
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Data do Cancelamento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                Data da Solicitação de Cancelamento
              </label>
              <input
                type="date"
                value={dataCancelamento}
                onChange={(e) => setDataCancelamento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {erroCalculo && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erroCalculo}
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={calcular}
              className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Calcular
            </button>
          </div>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className={`bg-white rounded-xl border-2 p-6 ${resultado.dentro_7_dias ? 'border-green-300' : resultado.tipo_pagamento === 'recorrente' ? 'border-amber-300' : 'border-red-300'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {resultado.dentro_7_dias ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : resultado.tipo_pagamento === 'recorrente' ? (
                  <Ban className="w-5 h-5 text-amber-500" />
                ) : (
                  <DollarSign className="w-5 h-5 text-red-500" />
                )}
                Resultado do Cálculo
              </h2>
              <button
                onClick={() => copiarResultado(resultado)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
              {gerarTextoResultado(resultado)}
            </div>

            {/* Resumo visual */}
            {!resultado.dentro_7_dias && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="text-base font-bold text-gray-900">R$ {formatCurrency(resultado.valor_total_contrato)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600">Multa 10%</p>
                  <p className="text-base font-bold text-red-700">R$ {formatCurrency(resultado.multa)}</p>
                </div>
                {resultado.tipo_pagamento !== 'recorrente' ? (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Valor Estorno</p>
                    <p className="text-base font-bold text-green-700">R$ {formatCurrency(resultado.estorno)}</p>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-600">Parcelas Canceladas</p>
                    <p className="text-base font-bold text-amber-700">{resultado.parcelas_restantes}x R$ {formatCurrency(resultado.valor_mensal)}</p>
                  </div>
                )}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600">Material (não reembolsável)</p>
                  <p className="text-base font-bold text-blue-700">R$ {formatCurrency(resultado.valor_produto)}</p>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400 italic">
              Se precisar, posso revisar o cálculo ou ajustar com base em novos dados.
            </p>
          </div>
        )}

        {/* Histórico */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistorico(!showHistorico)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <Clock className="w-5 h-5 text-gray-500" />
              Histórico de Cálculos ({historico.length})
              {showHistorico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {historico.length > 0 && (
              <button
                onClick={limparHistorico}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar tudo
              </button>
            )}
          </div>

          {showHistorico && (
            <div className="mt-4 space-y-3">
              {historico.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Nenhum cálculo realizado ainda.</p>
              ) : (
                historico.map((h) => (
                  <div key={h.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{h.nome || h.email}</span>
                        <span className="text-xs text-gray-500">{h.produto}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          h.dentro_7_dias ? 'bg-green-100 text-green-700' :
                          h.tipo_pagamento === 'recorrente' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {h.dentro_7_dias ? '7 dias' : h.tipo_pagamento === 'recorrente' ? 'Recorrente' : 'Estorno'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(h.timestamp).toLocaleDateString('pt-BR')} {new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => copiarResultado(h)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => removerDoHistorico(h.id)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div>
                        <span className="text-gray-400">Contrato:</span>{' '}
                        <span className="font-medium">R$ {formatCurrency(h.valor_total_contrato)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Multa:</span>{' '}
                        <span className="font-medium text-red-600">R$ {formatCurrency(h.multa)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Estorno:</span>{' '}
                        <span className="font-medium text-green-600">R$ {formatCurrency(h.estorno)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Meses:</span>{' '}
                        <span className="font-medium">{h.meses_utilizados}/{h.quantidade_total_meses}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Solicitação:</span>{' '}
                        <span className="font-medium">{h.data_cancelamento}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
