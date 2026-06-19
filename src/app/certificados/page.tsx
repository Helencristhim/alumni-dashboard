'use client';

import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Award,
  Download,
  Eye,
  RefreshCw,
  User,
  FileText,
  Hash,
} from 'lucide-react';

// Niveis de certificado e seus modulos
const CERTIFICATE_LEVELS = [
  {
    id: 'essential',
    label: 'Essential',
    color: '#22C55E',
    modules: [1, 2, 3, 4],
  },
  {
    id: 'confidence',
    label: 'Confidence',
    color: '#3B82F6',
    modules: [0], // arquivo sem numero: "Confidence.pdf"
  },
  {
    id: 'rise',
    label: 'Rise',
    color: '#F59E0B',
    modules: [1, 2, 3],
  },
  {
    id: 'apex',
    label: 'Apex',
    color: '#EF4444',
    modules: [1, 2, 3],
  },
];

export default function CertificadosPage() {
  const [studentName, setStudentName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('confidence');
  const [selectedModule, setSelectedModule] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<Uint8Array | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedCert = CERTIFICATE_LEVELS.find(c => c.id === selectedLevel)!;
  const hasModules = !(selectedCert.modules.length === 1 && selectedCert.modules[0] === 0);

  // Nome do arquivo PDF: "Apex/Apex 1.pdf" ou "Confidence/Confidence.pdf"
  const getPdfPath = () => {
    const level = selectedCert.label;
    if (!hasModules) return `/certificates/${level}/${level}.pdf`;
    return `/certificates/${level}/${level} ${selectedModule}.pdf`;
  };

  const getDisplayName = () => {
    if (!hasModules) return selectedCert.label;
    return `${selectedCert.label} ${selectedModule}`;
  };

  const generateCertificate = useCallback(async () => {
    if (!studentName.trim()) {
      setError('Digite o nome do aluno');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pdfPath = getPdfPath();
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(
          `Certificado "${getDisplayName()}" nao encontrado. Adicione o arquivo "${selectedCert.label} ${selectedModule}.pdf" na pasta public/certificates/${selectedCert.label}/`
        );
      }
      const pdfBytes = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[0];
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const name = studentName.trim();
      let fontSize = 36;
      let textWidth = font.widthOfTextAtSize(name, fontSize);

      while (textWidth > width * 0.45 && fontSize > 18) {
        fontSize -= 1;
        textWidth = font.widthOfTextAtSize(name, fontSize);
      }

      const x = (width - textWidth) / 2;
      const y = height * 0.515;

      page.drawText(name, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      const modifiedPdfBytes = await pdfDoc.save();
      setGeneratedPdfBytes(modifiedPdfBytes);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar certificado';
      setError(message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentName, selectedLevel, selectedModule, previewUrl]);

  const downloadPdf = useCallback(() => {
    if (!generatedPdfBytes) return;

    const blob = new Blob([generatedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const safeName = studentName.trim().replace(/\s+/g, '-');
    const levelLabel = hasModules ? `${selectedCert.label}-${selectedModule}` : selectedCert.label;
    a.download = `Certificado-${safeName}-${levelLabel}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedPdfBytes, studentName, selectedCert, selectedModule]);

  const resetForm = () => {
    setStudentName('');
    setPreviewUrl(null);
    setGeneratedPdfBytes(null);
    setError(null);
  };

  return (
    <DashboardLayout
      title="Certificados"
      description="Gere certificados de conclusao por nivel e modulo"
    >
      <div className="space-y-6">
        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedCert.color}15` }}
            >
              <Award className="w-5 h-5" style={{ color: selectedCert.color }} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Gerar Certificado</h2>
              <p className="text-sm text-gray-500">Selecione o nivel, modulo e digite o nome do aluno</p>
            </div>
          </div>

          {/* Seletor de nivel */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CERTIFICATE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    setSelectedLevel(level.id);
                    setSelectedModule(1);
                    setPreviewUrl(null);
                    setGeneratedPdfBytes(null);
                    setError(null);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedLevel === level.id
                      ? 'shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedLevel === level.id ? level.color : undefined,
                    backgroundColor: selectedLevel === level.id ? `${level.color}08` : undefined,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: selectedLevel === level.id ? level.color : '#E5E7EB',
                    }}
                  >
                    <FileText
                      className="w-5 h-5"
                      style={{
                        color: selectedLevel === level.id ? 'white' : '#9CA3AF',
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <span
                      className={`text-sm font-bold block ${
                        selectedLevel === level.id ? '' : 'text-gray-700'
                      }`}
                      style={{
                        color: selectedLevel === level.id ? level.color : undefined,
                      }}
                    >
                      {level.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {level.modules.length} modulos
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de modulo - so mostra se nivel tem mais de 1 modulo */}
          {hasModules && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modulo
              </label>
              <div className="flex gap-2 flex-wrap">
                {selectedCert.modules.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => {
                      setSelectedModule(mod);
                      setPreviewUrl(null);
                      setGeneratedPdfBytes(null);
                      setError(null);
                    }}
                    className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all cursor-pointer flex items-center justify-center ${
                      selectedModule === mod
                        ? 'text-white shadow-md scale-105'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: selectedModule === mod ? selectedCert.color : undefined,
                      borderColor: selectedModule === mod ? selectedCert.color : undefined,
                    }}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicador do certificado selecionado */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Certificado selecionado: <strong className="text-gray-600">{getDisplayName()}</strong>
            </p>
          </div>

          {/* Campo nome do aluno */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Aluno
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateCertificate();
                }}
                placeholder="Ex: Leticia Gabrielle Correia"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Botoes */}
          <div className="flex gap-3">
            <button
              onClick={generateCertificate}
              disabled={loading || !studentName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer font-medium"
              style={{ backgroundColor: selectedCert.color }}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {loading ? 'Gerando...' : 'Visualizar'}
            </button>

            {generatedPdfBytes && (
              <>
                <button
                  onClick={downloadPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors cursor-pointer font-medium"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Novo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" style={{ color: selectedCert.color }} />
                <h3 className="font-semibold text-gray-900">
                  {studentName} - {getDisplayName()}
                </h3>
              </div>
              <button
                onClick={downloadPdf}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full rounded-lg border border-gray-200 shadow-sm"
                style={{ height: '680px' }}
                title="Preview do Certificado"
              />
            </div>
          </div>
        )}

        {/* Instrucoes quando nao tem preview */}
        {!previewUrl && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecione nivel, modulo e digite o nome
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Escolha o nivel e modulo do certificado, digite o nome completo do aluno e clique em
              &quot;Visualizar&quot; para gerar o certificado em PDF.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
