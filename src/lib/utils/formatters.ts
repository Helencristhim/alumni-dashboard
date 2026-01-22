// ============================================================
// UTILITÁRIOS DE FORMATAÇÃO
// ============================================================

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata valor como moeda compacta (ex: R$ 1,5M)
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0';

  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}K`;
  }

  return formatCurrency(value);
}

/**
 * Formata número com separador de milhar
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';

  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata número como percentual
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '0%';

  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formata data no padrão brasileiro
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

/**
 * Formata data abreviada (ex: 22 Jan)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(d);
}

/**
 * Formata mês/ano (ex: Janeiro 2024)
 */
export function formatMonthYear(date: Date | string | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(d);
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calculateChange(current: number, previous: number): {
  value: number;
  type: 'increase' | 'decrease' | 'neutral';
} {
  if (previous === 0) {
    return { value: 0, type: 'neutral' };
  }

  const change = ((current - previous) / previous) * 100;

  return {
    value: Math.abs(change),
    type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral'
  };
}

/**
 * Formata variação com ícone
 */
export function formatChange(change: number, type: 'increase' | 'decrease' | 'neutral'): string {
  const icon = type === 'increase' ? '↑' : type === 'decrease' ? '↓' : '→';
  return `${icon} ${Math.abs(change).toFixed(1)}%`;
}

/**
 * Formata tempo em minutos para exibição legível
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '-';

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Formata dias de atraso
 */
export function formatDaysLate(days: number | null | undefined): string {
  if (days === null || days === undefined || days === 0) return 'Em dia';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

/**
 * Trunca texto com reticências
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Gera cores para gráficos de pizza/barras
 */
export function getChartColors(count: number): string[] {
  const baseColors = [
    '#10B981', // Verde
    '#3B82F6', // Azul
    '#8B5CF6', // Roxo
    '#F59E0B', // Laranja
    '#EF4444', // Vermelho
    '#06B6D4', // Ciano
    '#EC4899', // Rosa
    '#84CC16', // Lima
    '#F97316', // Laranja escuro
    '#6366F1', // Indigo
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Se precisar de mais cores, repete com variações
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
}

/**
 * Agrupa dados por período (dia, semana, mês)
 */
export function groupByPeriod<T extends { [key: string]: unknown }>(
  data: T[],
  dateField: keyof T,
  period: 'day' | 'week' | 'month'
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  data.forEach(item => {
    const dateValue = item[dateField];
    if (!(dateValue instanceof Date)) return;

    let key: string;

    switch (period) {
      case 'day':
        key = formatDate(dateValue);
        break;
      case 'week':
        const weekStart = new Date(dateValue);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = `Semana ${formatDateShort(weekStart)}`;
        break;
      case 'month':
        key = formatMonthYear(dateValue);
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return groups;
}

/**
 * Filtra dados por período
 */
export function filterByDateRange<T extends { [key: string]: unknown }>(
  data: T[],
  dateField: keyof T,
  startDate: Date,
  endDate: Date
): T[] {
  return data.filter(item => {
    const dateValue = item[dateField];
    if (!(dateValue instanceof Date)) return false;

    return dateValue >= startDate && dateValue <= endDate;
  });
}
