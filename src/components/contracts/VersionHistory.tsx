'use client';

import { useState } from 'react';
import { Clock, RotateCcw, Eye, X } from 'lucide-react';
import { ContractVersionData } from '@/types/contracts';

interface VersionHistoryProps {
  versions: ContractVersionData[];
  currentVersion: number;
  onRestore: (version: ContractVersionData) => void;
  onPreview: (version: ContractVersionData) => void;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  onPreview,
}: VersionHistoryProps) {
  const [previewVersion, setPreviewVersion] = useState<ContractVersionData | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Histórico de Versões</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {versions.length} versão(ões) salva(s) | Versão atual: v{currentVersion}
          </p>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {sortedVersions.map((version) => (
            <div
              key={version.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                version.version === currentVersion ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      Versão {version.version}
                    </span>
                    {version.version === currentVersion && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(version.createdAt).toLocaleString('pt-BR')}
                  </p>
                  {version.changeNote && (
                    <p className="text-xs text-gray-600 mt-1">{version.changeNote}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setPreviewVersion(version);
                      onPreview(version);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {version.version !== currentVersion && (
                    <button
                      onClick={() => onRestore(version)}
                      className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50"
                      title="Restaurar esta versão"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Preview - Versão {previewVersion.version}
              </h3>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewVersion.htmlContent }}
            />
          </div>
        </div>
      )}
    </>
  );
}
