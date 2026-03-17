'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Save,
  Upload,
  Image as ImageIcon,
  Palette,
  FileText,
  Loader2,
  Check,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { BrandConfigData } from '@/types/contracts';

interface BrandFormState extends BrandConfigData {
  logoFile?: File | null;
  logoPreview?: string;
}

const DEFAULT_BRANDS: BrandFormState[] = [
  {
    brand: 'alumni',
    displayName: 'Alumni',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    logoUrl: '',
    footerText: '',
    cnpj: '53.286.868/0001-66',
    endereco: 'Calçada dos Crisântemos, nº 18 – Condomínio Centro Comercial de Alphaville, Barueri/SP – CEP 06453-008',
    telefone: '',
    email: '',
  },
  {
    brand: 'better',
    displayName: 'Better EdTech',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    logoUrl: '',
    footerText: '',
    cnpj: '53.286.868/0001-66',
    endereco: 'Calçada dos Crisântemos, nº 18 – Condomínio Centro Comercial de Alphaville, Barueri/SP – CEP 06453-008',
    telefone: '',
    email: '',
  },
];

function BrandCard({
  brand,
  onSave,
}: {
  brand: BrandFormState;
  onSave: (data: BrandFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<BrandFormState>(brand);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof BrandFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        logoFile: file,
        logoPreview: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
    setSaved(false);
  };

  const handleUploadAndSave = async () => {
    setSaving(true);
    try {
      let logoUrl = form.logoUrl || '';

      // Upload logo se selecionado
      if (form.logoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', form.logoFile);
        formData.append('brand', form.brand);

        const uploadRes = await fetch('/api/branding/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadRes.json();

        if (uploadResult.success) {
          logoUrl = uploadResult.data.url;
        }
        setUploading(false);
      }

      await onSave({ ...form, logoUrl });
      setForm((prev) => ({ ...prev, logoUrl, logoFile: null }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setForm((prev) => ({
      ...prev,
      logoUrl: '',
      logoFile: null,
      logoPreview: undefined,
    }));
    setSaved(false);
  };

  const currentLogo = form.logoPreview || form.logoUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header com cor da marca */}
      <div
        className="p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
        }}
      >
        <h3 className="font-bold text-lg">{form.displayName}</h3>
        <p className="text-white/80 text-sm">Configurações da marca "{form.brand}"</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Logo */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <ImageIcon className="w-4 h-4" />
            Logo da Marca
          </label>
          <div className="flex items-start gap-4">
            <div
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentLogo ? (
                <img
                  src={currentLogo}
                  alt={`Logo ${form.displayName}`}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Clique para enviar</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-500">
                Formatos: PNG, JPG, SVG ou WebP. Máximo 2MB.
              </p>
              <p className="text-xs text-gray-500">
                Recomendado: fundo transparente, proporção retangular.
              </p>
              {currentLogo && (
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cores */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Palette className="w-4 h-4" />
            Cores
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cor Primária</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cor Secundária</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dados da empresa */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <FileText className="w-4 h-4" />
            Dados para Contratos
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome de Exibição</label>
              <input
                value={form.displayName}
                onChange={(e) => update('displayName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CNPJ</label>
                <input
                  value={form.cnpj || ''}
                  onChange={(e) => update('cnpj', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                <input
                  value={form.telefone || ''}
                  onChange={(e) => update('telefone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Endereço</label>
              <input
                value={form.endereco || ''}
                onChange={(e) => update('endereco', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Texto do Rodapé (aparece no final dos contratos)
              </label>
              <textarea
                value={form.footerText || ''}
                onChange={(e) => update('footerText', e.target.value)}
                rows={3}
                placeholder="Ex: BETTER TECH LTDA – CNPJ 53.286.868/0001-66 – Calçada dos Crisântemos, 18..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={handleUploadAndSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {uploading ? 'Enviando logo...' : saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Marca'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [brands, setBrands] = useState<BrandFormState[]>(DEFAULT_BRANDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/branding');
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          // Merge dados do banco com defaults
          const merged = DEFAULT_BRANDS.map((def) => {
            const fromDb = result.data.find(
              (b: BrandConfigData) => b.brand === def.brand
            );
            return fromDb ? { ...def, ...fromDb } : def;
          });
          setBrands(merged);
        }
      } catch (err) {
        console.error('Erro ao carregar marcas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const handleSave = async (data: BrandFormState) => {
    const response = await fetch('/api/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: data.brand,
        displayName: data.displayName,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        footerText: data.footerText,
        cnpj: data.cnpj,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/contratos-b2b"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações de Marca</h1>
            <p className="text-gray-500 mt-1">
              Logo, cores e dados que aparecem nos contratos gerados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6">
            {brands.map((brand) => (
              <BrandCard key={brand.brand} brand={brand} onSave={handleSave} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
