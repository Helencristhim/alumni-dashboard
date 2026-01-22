'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrencyCompact, formatNumber, getChartColors } from '@/lib/utils/formatters';

interface ChartProps {
  data: Array<Record<string, unknown>>;
  height?: number;
  loading?: boolean;
}

interface LineChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  yKey2?: string;
  color?: string;
  color2?: string;
  yAxisLabel?: string;
  formatY?: 'currency' | 'number' | 'percentage';
}

interface BarChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  horizontal?: boolean;
  formatY?: 'currency' | 'number' | 'percentage';
}

interface PieChartProps extends ChartProps {
  nameKey: string;
  valueKey: string;
  showLabels?: boolean;
}

interface AreaChartProps extends ChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  formatY?: 'currency' | 'number' | 'percentage';
}

// Componente de loading
function ChartLoading({ height = 300 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
      style={{ height }}
    >
      <p className="text-gray-400">Carregando...</p>
    </div>
  );
}

// Formatador de tooltip personalizado
function formatTooltipValue(value: number, format?: 'currency' | 'number' | 'percentage'): string {
  switch (format) {
    case 'currency':
      return formatCurrencyCompact(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    default:
      return formatNumber(value);
  }
}

// Gráfico de Linha
export function LineChart({
  data,
  xKey,
  yKey,
  yKey2,
  color = '#10B981',
  color2 = '#3B82F6',
  height = 300,
  formatY = 'number',
  loading = false
}: LineChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => formatTooltipValue(value, formatY)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
          formatter={(value) => [formatTooltipValue(Number(value), formatY), '']}
        />
        {yKey2 && <Legend />}
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: color }}
        />
        {yKey2 && (
          <Line
            type="monotone"
            dataKey={yKey2}
            stroke={color2}
            strokeWidth={2}
            dot={{ fill: color2, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color2 }}
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Gráfico de Barras
export function BarChartComponent({
  data,
  xKey,
  yKey,
  color = '#10B981',
  height = 300,
  horizontal = false,
  formatY = 'number',
  loading = false
}: BarChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 30, left: horizontal ? 100 : 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => formatTooltipValue(value, formatY)}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              width={90}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => formatTooltipValue(value, formatY)}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
          formatter={(value) => [formatTooltipValue(Number(value), formatY), '']}
        />
        <Bar
          dataKey={yKey}
          fill={color}
          radius={[4, 4, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Gráfico de Pizza
export function PieChartComponent({
  data,
  nameKey,
  valueKey,
  height = 300,
  showLabels = true,
  loading = false
}: PieChartProps) {
  if (loading) return <ChartLoading height={height} />;

  const colors = getChartColors(data.length);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={60}
          paddingAngle={2}
          label={showLabels ? ({ name, percent }) =>
            `${name}: ${((percent || 0) * 100).toFixed(0)}%`
          : undefined}
          labelLine={showLabels}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
          formatter={(value) => [formatNumber(Number(value)), '']}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Gráfico de Área
export function AreaChartComponent({
  data,
  xKey,
  yKey,
  color = '#10B981',
  height = 300,
  formatY = 'number',
  loading = false
}: AreaChartProps) {
  if (loading) return <ChartLoading height={height} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={(value) => formatTooltipValue(value, formatY)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
          formatter={(value) => [formatTooltipValue(Number(value), formatY), '']}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

// Wrapper de Card para Gráficos
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
