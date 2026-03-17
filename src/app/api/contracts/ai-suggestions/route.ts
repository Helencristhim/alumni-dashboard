import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AISuggestion } from '@/types/contracts';

// POST /api/contracts/ai-suggestions - Gerar sugestões via LLM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractData, programs, contractType, htmlContent } = body;

    // Se Claude API não está configurada, retornar vazio
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const valorTotal = (programs || []).reduce(
      (sum: number, p: { valorTotal?: number }) => sum + (p.valorTotal || 0),
      0
    );
    const totalAlunos = (programs || []).reduce(
      (sum: number, p: { quantidade?: number }) => sum + (p.quantidade || 0),
      0
    );

    const prompt = `Você é um advogado corporativo especializado em contratos de prestação de serviços educacionais (cursos de idiomas para empresas).

Analise o seguinte contrato e sugira cláusulas adicionais que possam proteger ambas as partes ou melhorar o contrato.

CONTEXTO:
- Tipo de contrato: ${contractType}
- Valor total: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de participantes: ${totalAlunos}
- Prazo: ${contractData?.prazo_meses || 'não definido'} meses
- Forma de pagamento: ${contractData?.forma_pagamento || 'não definida'}
- Programas: ${(programs || []).map((p: { tipoPrograma: string }) => p.tipoPrograma).join(', ')}

TRECHO DO CONTRATO ATUAL:
${htmlContent?.substring(0, 2000) || 'Contrato em branco'}

Retorne EXATAMENTE um JSON array com até 3 sugestões, cada uma com:
{
  "id": "llm-<identificador-unico>",
  "title": "Título curto da sugestão",
  "description": "Explicação em 1-2 frases de por que essa cláusula é importante",
  "clauseText": "<h3>Cláusula - Título</h3><p>Texto da cláusula em HTML...</p>",
  "category": "geral",
  "priority": "medium",
  "source": "llm"
}

Categorias possíveis: valor, prazo, programa, pagamento, protecao, geral
Prioridades: high, medium, low

Retorne SOMENTE o JSON array, sem markdown ou texto adicional.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    let suggestions: AISuggestion[] = [];
    try {
      suggestions = JSON.parse(content.text);
    } catch {
      // Tentar extrair JSON do texto
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Erro ao gerar sugestões IA:', error);
    return NextResponse.json({ success: true, suggestions: [] });
  }
}
