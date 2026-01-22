'use client';

import { ExternalLink, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface DataSourceLinkProps {
  url: string;
  lastUpdated?: Date;
  onRefresh?: () => void;
  loading?: boolean;
}

export function DataSourceLink({
  url,
  lastUpdated,
  onRefresh,
  loading = false
}: DataSourceLinkProps) {
  const isGoogleSheet = url.includes('docs.google.com/spreadsheets');
  const isExcel = url.endsWith('.xlsx') || url.endsWith('.xls');

  return (
    <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        <span>Fonte de dados:</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          {isGoogleSheet ? 'Google Sheets' : isExcel ? 'Excel' : 'Planilha'}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {lastUpdated && (
        <div className="flex items-center gap-1 text-gray-400">
          <span>|</span>
          <span>Atualizado: {formatDate(lastUpdated)}</span>
        </div>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto flex items-center gap-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      )}
    </div>
  );
}
