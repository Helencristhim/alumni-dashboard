// ============================================================
// DADOS DE CONTRATADA POR MARCA
// ============================================================

export const BRAND_DEFAULTS: Record<string, {
  empresa_contratada_nome: string;
  empresa_contratada_cnpj: string;
  empresa_contratada_endereco: string;
  empresa_representante_nome: string;
  empresa_representante_cpf: string;
  foro_cidade: string;
  foro_estado: string;
}> = {
  alumni: {
    empresa_contratada_nome: 'BETTER TECH LTDA',
    empresa_contratada_cnpj: '53.286.868/0001-66',
    empresa_contratada_endereco: 'Calçada dos Crisântemos, nº 18 – Condomínio Centro Comercial de Alphaville, Barueri/SP – CEP 06453-008',
    empresa_representante_nome: 'Juliana Galdino Melo de Lima',
    empresa_representante_cpf: '397.256.838-03',
    foro_cidade: 'Barueri',
    foro_estado: 'SP',
  },
  better: {
    empresa_contratada_nome: 'BETTER TECH LTDA',
    empresa_contratada_cnpj: '53.286.868/0001-66',
    empresa_contratada_endereco: 'Calçada dos Crisântemos, nº 18 – Condomínio Centro Comercial de Alphaville, Barueri/SP – CEP 06453-008',
    empresa_representante_nome: 'Juliana Galdino Melo de Lima',
    empresa_representante_cpf: '397.256.838-03',
    foro_cidade: 'Barueri',
    foro_estado: 'SP',
  },
};

// Gerar número do contrato
export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999) + 1;
  return `CTR-${year}-${String(random).padStart(3, '0')}`;
}

// Substituir variáveis no HTML
export function replaceVariables(
  html: string,
  variables: Record<string, string>
): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || `{{${key}}}`);
  }
  return result;
}

// Extrair variáveis não preenchidas do HTML
export function extractUnfilledVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}
