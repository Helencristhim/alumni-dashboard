// ============================================================
// STORAGE - Download direto (sem cloud storage)
// Os arquivos são gerados sob demanda e enviados ao navegador.
// Futuramente pode ser migrado para Vercel Blob ou S3.
// ============================================================

// Gerar nome do arquivo
export function generateFileName(
  contractNumber: string,
  version: number,
  type: 'pdf' | 'docx'
): string {
  return `contrato_${contractNumber}_v${version}.${type}`;
}
