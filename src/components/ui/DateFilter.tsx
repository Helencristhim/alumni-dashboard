'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

type PeriodPreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';

interface DateFilterProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
}

const presets: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last7days', label: 'Últimos 7 dias' },
  { value: 'last30days', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês passado' },
  { value: 'thisQuarter', label: 'Este trimestre' },
  { value: 'thisYear', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

function getPresetDates(preset: PeriodPreset): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return { start: today, end: endOfDay };

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return { start: yesterday, end: endYesterday };

    case 'last7days':
      const start7 = new Date(today);
      start7.setDate(start7.getDate() - 6);
      return { start: start7, end: endOfDay };

    case 'last30days':
      const start30 = new Date(today);
      start30.setDate(start30.getDate() - 29);
      return { start: start30, end: endOfDay };

    case 'thisMonth':
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: startMonth, end: endOfDay };

    case 'lastMonth':
      const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start: startLastMonth, end: endLastMonth };

    case 'thisQuarter':
      const quarter = Math.floor(today.getMonth() / 3);
      const startQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      return { start: startQuarter, end: endOfDay };

    case 'thisYear':
      const startYear = new Date(today.getFullYear(), 0, 1);
      return { start: startYear, end: endOfDay };

    case 'custom':
    default:
      return { start: today, end: endOfDay };
  }
}

export function DateFilter({ startDate, endDate, onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('last30days');
  // Formata data para input type="date" sem problemas de fuso horário
  const formatForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [customStart, setCustomStart] = useState(formatForInput(startDate));
  const [customEnd, setCustomEnd] = useState(formatForInput(endDate));

  const displayText = useMemo(() => {
    if (selectedPreset === 'custom') {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return presets.find(p => p.value === selectedPreset)?.label || '';
  }, [selectedPreset, startDate, endDate]);

  const handlePresetSelect = (preset: PeriodPreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      onChange(start, end);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    // Usa formato com 'T00:00:00' para evitar interpretação UTC
    // que causa o problema de recuar um dia no fuso horário do Brasil
    const [startYear, startMonth, startDay] = customStart.split('-').map(Number);
    const [endYear, endMonth, endDay] = customEnd.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    onChange(start, end);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-4 min-w-[280px]">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {presets.slice(0, -1).map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedPreset === preset.value
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Período personalizado</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCustomApply}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Aplicar período
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
