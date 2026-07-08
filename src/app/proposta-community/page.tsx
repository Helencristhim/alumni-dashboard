'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FileDown, Eye, RotateCcw, GraduationCap, Headphones, BookOpen, Users, Video, Award, CheckCircle2 } from 'lucide-react';

interface PropostaData {
  nomeAluno: string;
  numAulas: number;
  duracaoAula: string;
  frequencia: string;
  modalidade: string;
  valorTotal: string;
  formaPagamento: string;
  parcelas: string;
  valorParcela: string;
  observacoes: string;
  validade: string;
  vendedor: string;
}

const INITIAL_DATA: PropostaData = {
  nomeAluno: '',
  numAulas: 32,
  duracaoAula: '60 min',
  frequencia: '2x por semana',
  modalidade: 'Online (Zoom)',
  valorTotal: '',
  formaPagamento: 'Parcelado',
  parcelas: '12',
  valorParcela: '',
  observacoes: '',
  validade: '7 dias',
  vendedor: '',
};

export default function PropostaCommunityPage() {
  const [data, setData] = useState<PropostaData>(INITIAL_DATA);
  const [showPreview, setShowPreview] = useState(false);
  const [showTermos, setShowTermos] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof PropostaData, value: string | number) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calc parcela
      if (field === 'valorTotal' || field === 'parcelas') {
        const total = parseFloat(String(field === 'valorTotal' ? value : next.valorTotal).replace(/[^\d,]/g, '').replace(',', '.'));
        const parc = parseInt(String(field === 'parcelas' ? value : next.parcelas)) || 1;
        if (total > 0 && parc > 0) {
          next.valorParcela = (total / parc).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
      }
      return next;
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !previewRef.current) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Alumni - ${data.nomeAluno || 'Cliente'}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a2e; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>${previewRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const formatCurrency = (val: string) => {
    const num = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <DashboardLayout title="Proposta Community" description="Gere propostas personalizadas para novos alunos">
      <div className="flex gap-6">
        {/* ── FORMULÁRIO ── */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Dados da Proposta</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nome do Aluno</label>
                <input type="text" value={data.nomeAluno} onChange={e => update('nomeAluno', e.target.value)} placeholder="Nome completo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">N° de Aulas</label>
                  <input type="number" value={data.numAulas} onChange={e => update('numAulas', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duração</label>
                  <select value={data.duracaoAula} onChange={e => update('duracaoAula', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                    <option>90 min</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Frequência</label>
                  <select value={data.frequencia} onChange={e => update('frequencia', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option>1x por semana</option>
                    <option>2x por semana</option>
                    <option>3x por semana</option>
                    <option>5x por semana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Modalidade</label>
                  <select value={data.modalidade} onChange={e => update('modalidade', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option>Online (Zoom)</option>
                    <option>Presencial</option>
                    <option>Híbrido</option>
                  </select>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valor Total (R$)</label>
                <input type="text" value={data.valorTotal} onChange={e => update('valorTotal', e.target.value)} placeholder="Ex: 6.400,00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                {data.valorTotal && (() => {
                  const total = parseFloat(data.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));
                  if (isNaN(total) || total <= 0) return null;
                  const metade = (total / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  return (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Aulas</p>
                        <p className="text-sm font-semibold text-blue-800">{metade}</p>
                      </div>
                      <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Material Didático</p>
                        <p className="text-sm font-semibold text-emerald-800">{metade}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Forma de Pagamento</label>
                  <select value={data.formaPagamento} onChange={e => update('formaPagamento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option>À vista</option>
                    <option>Parcelado</option>
                    <option>Recorrência mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Parcelas</label>
                  <select value={data.parcelas} onChange={e => update('parcelas', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" disabled={data.formaPagamento === 'À vista'}>
                    {[1,2,3,4,5,6,8,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
              </div>

              {data.valorParcela && data.formaPagamento !== 'À vista' && (
                <p className="text-sm text-emerald-600 font-semibold">{data.parcelas}x de {data.valorParcela}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Vendedor</label>
                <input type="text" value={data.vendedor} onChange={e => update('vendedor', e.target.value)} placeholder="Nome do consultor" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Validade</label>
                <select value={data.validade} onChange={e => update('validade', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option>3 dias</option>
                  <option>5 dias</option>
                  <option>7 dias</option>
                  <option>15 dias</option>
                  <option>30 dias</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observações</label>
                <textarea value={data.observacoes} onChange={e => update('observacoes', e.target.value)} rows={3} placeholder="Notas internas ou condições especiais..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowPreview(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003080] text-white rounded-lg text-sm font-semibold hover:bg-[#002060] transition-colors cursor-pointer">
                  <Eye className="w-4 h-4" /> Visualizar
                </button>
                <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer">
                  <FileDown className="w-4 h-4" /> Salvar PDF
                </button>
              </div>

              <button onClick={() => { setData(INITIAL_DATA); setShowPreview(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> Limpar formulário
              </button>
            </div>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="flex-1 min-w-0">
          <div ref={previewRef}>
            <PropostaPreview data={data} onOpenTermos={() => setShowTermos(true)} />
          </div>
        </div>
      </div>

      {/* ── MODAL TERMOS ── */}
      {showTermos && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowTermos(false)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 700, width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: '#003080' }}>Termos e Condições</h2>
              <button onClick={() => setShowTermos(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>&#10005;</button>
            </div>
            <div style={{ padding: '24px 28px', overflowY: 'auto', fontSize: 13, lineHeight: 1.8, color: '#374151' }}>
              <TermosConteudo />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function PropostaPreview({ data, onOpenTermos }: { data: PropostaData; onOpenTermos: () => void }) {
  const nome = data.nomeAluno || '________';
  const valorDisplay = data.valorTotal ? `R$ ${data.valorTotal}` : 'R$ ______';
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a2e', background: '#fff', maxWidth: 800, margin: '0 auto' }}>

      {/* PAGE 1 — CAPA */}
      <div style={{ background: 'linear-gradient(135deg, #003080 0%, #001845 100%)', color: '#fff', padding: '60px 48px', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 12, marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 48 }}>
            <img src="/logos/alumni-by-better.png" alt="Alumni by Better" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' as const, opacity: 0.6, marginBottom: 12 }}>Proposta Community</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 42, fontWeight: 600, lineHeight: 1.15, marginBottom: 16 }}>
            {nome}
          </h1>
          <p style={{ fontSize: 16, opacity: 0.75, lineHeight: 1.6, maxWidth: 500 }}>
            Curso de inglês online e ao vivo, com foco total em conversação para você se comunicar com confiança em situações reais do dia a dia.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, opacity: 0.6, marginTop: 32 }}>
          <span>{hoje}</span>
          <span>Validade: {data.validade}</span>
          {data.vendedor && <span>Consultor: {data.vendedor}</span>}
        </div>
      </div>

      {/* SEÇÃO — POR QUE ALUMNI */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 16 }}>Por que a Alumni?</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4a4a5a', marginBottom: 20 }}>
          No Community, você aprende inglês do jeito que ele realmente se aprende: <strong>conversando</strong>. É um curso online e ao vivo, em turmas reduzidas de até 8 alunos, com foco total em conversação. Cada aula parte de <strong>situações reais do dia a dia</strong> — reuniões, entrevistas, viagens e conversas informais — para você desenvolver fluência com naturalidade, no seu ritmo e com flexibilidade total de horários.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { icon: <Users size={18} />, title: 'Turmas Reduzidas', desc: 'Máximo de 8 alunos por grupo — você pratica e é ouvido em todas as aulas' },
            { icon: <BookOpen size={18} />, title: 'Metodologia Pre / Live / Post Class', desc: 'Você prepara na plataforma, pratica ao vivo com o professor e revisa depois' },
            { icon: <Headphones size={18} />, title: 'Professores Certificados', desc: 'Time com certificações internacionais (CELTA, CPE, CAE, DELTA) e experiência real' },
            { icon: <Video size={18} />, title: 'Plataforma Interativa e Gamificada', desc: 'Atividades, quizzes e painel Leaderboard — no computador ou celular, sem baixar app' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,48,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003080', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO — COMO FUNCIONA (Pre / Live / Post Class) */}
      <div style={{ padding: '32px 48px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 8 }}>Como funciona</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>O aprendizado em grupo é essencial para a vida real: conversar com diferentes pessoas, sotaques e estilos estimula a escuta ativa, a adaptação e acelera sua fluência de forma natural. E cada aula acontece em três etapas, para você chegar preparado, praticar de verdade e fixar o que aprendeu.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { icon: <BookOpen size={20} />, title: 'Pre Class', tag: 'aquecimento', desc: 'Atividades curtas para ativar vocabulário e ideias do tema da aula. O aluno chega preparado, com mais repertório e segurança para falar.' },
            { icon: <Video size={20} />, title: 'Live Class', tag: 'ao vivo', desc: 'Condução do professor, foco em conversação, escuta ativa e role-plays de situações reais. Feedback imediato e gramática aplicada ao contexto.' },
            { icon: <Award size={20} />, title: 'Post Class', tag: 'fixação e avanço', desc: 'Revisão guiada do conteúdo, prática dirigida (ex.: Grammar Practice, Speaking Trainer) e registro do que foi conquistado — com próximo passo claro para evoluir.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 20, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(0,48,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003080', marginBottom: 12 }}>
                {item.icon}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{item.title} <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>({item.tag})</span></p>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO — PLATAFORMA */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 12 }}>Estude com autonomia em uma plataforma moderna e intuitiva</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#4a4a5a', marginBottom: 16 }}>A plataforma de estudos do Community é moderna, intuitiva e pensada para facilitar seu progresso. Tudo o que você precisa em um só lugar, no computador ou no celular — sem baixar aplicativo:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            'Atividades interativas de preparação antes das aulas',
            'Quiz de fixação do conteúdo após a aula',
            'Exercícios extras para acelerar seu aprendizado',
            'Desempenho gamificado em tempo real no painel Leaderboard',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span style={{ fontSize: 13.5, color: '#2d2d3a' }}>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#003080' }}>Seu aprendizado com liberdade, autonomia e suporte contínuo.</p>
      </div>

      {/* SEÇÃO — CERTIFICAÇÃO */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: 'linear-gradient(135deg, #3b1e6e 0%, #2a1250 100%)', borderRadius: 12, color: '#fff' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, marginBottom: 12 }}>Reconhecimento que abre portas</h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.9, marginBottom: 12 }}>Ao concluir os níveis do Curso de Inglês Online Community, você recebe uma <strong>certificação binacional reconhecida no Brasil e nos Estados Unidos</strong>, mediante uma prova que mede as habilidades adquiridas ao longo do curso.</p>
        <p style={{ fontSize: 15, fontWeight: 700 }}>Um diferencial legítimo no currículo acadêmico e profissional.</p>
      </div>

      {/* SEÇÃO — O QUE ESTÁ INCLUÍDO */}
      <div style={{ padding: '32px 48px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 20 }}>O que está incluído</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Aulas online e ao vivo com foco total em conversação',
            'Turmas reduzidas de até 8 alunos por grupo',
            'Metodologia em 3 passos: Pre Class, Live Class e Post Class',
            'Plataforma de estudos interativa com quizzes e exercícios extras',
            'Painel Leaderboard com acompanhamento de desempenho em tempo real',
            'Teste de nivelamento e trilha com 11 níveis evolutivos (CEFR)',
            'Flexibilidade para agendar suas aulas no melhor dia e horário',
            'Certificação binacional reconhecida no Brasil e nos Estados Unidos',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 7 ? '1px solid #f0f0f0' : 'none' }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span style={{ fontSize: 13.5, color: '#2d2d3a' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO — SEU PROGRAMA */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 20 }}>Seu Programa</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Aluno', value: nome },
            { label: 'Número de Aulas', value: `${data.numAulas} aulas` },
            { label: 'Duração por Aula', value: data.duracaoAula },
            { label: 'Frequência', value: data.frequencia },
            { label: 'Modalidade', value: data.modalidade },
            { label: 'Duração Estimada', value: `${Math.ceil(data.numAulas / (data.frequencia.startsWith('1') ? 4 : data.frequencia.startsWith('2') ? 8 : data.frequencia.startsWith('3') ? 12 : 20))} meses` },
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#003080', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO — INVESTIMENTO */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: 'linear-gradient(135deg, #003080 0%, #001845 100%)', borderRadius: 12, color: '#fff' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, marginBottom: 20 }}>Investimento</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 700 }}>{valorDisplay}</span>
          {data.numAulas > 0 && data.valorTotal && (
            <span style={{ fontSize: 14, opacity: 0.7 }}>
              ({(parseFloat(data.valorTotal.replace(/[^\d,]/g, '').replace(',', '.')) / data.numAulas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por aula)
            </span>
          )}
        </div>
        {data.formaPagamento !== 'À vista' && data.valorParcela && (
          <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 4 }}>
            ou <strong>{data.parcelas}x de {data.valorParcela}</strong>
          </p>
        )}
        {data.valorTotal && (() => {
          const total = parseFloat(data.valorTotal.replace(/[^\d,]/g, '').replace(',', '.'));
          if (isNaN(total) || total <= 0) return null;
          const metade = (total / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>Aulas</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{metade}</p>
              </div>
              <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>Material Didático</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{metade}</p>
              </div>
            </div>
          );
        })()}
        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>
          Forma de pagamento: {data.formaPagamento} | Proposta válida por {data.validade}
        </p>
      </div>

      {/* BOTÃO TERMOS */}
      <div style={{ padding: '16px 48px', marginBottom: 24, textAlign: 'center' as const }}>
        <button onClick={onOpenTermos} style={{ background: 'none', border: '1px solid #003080', color: '#003080', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s' }}>
          Termos e Condições
        </button>
      </div>

      {/* SEÇÃO — PERGUNTAS FREQUENTES */}
      <div style={{ padding: '32px 48px', marginBottom: 24, background: '#f8f9fa', borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 20 }}>Perguntas Frequentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { q: 'Posso fazer o curso mesmo sem saber nada de inglês?', a: 'Sim. Você realizará um teste de nivelamento para ser direcionado ao módulo ideal. Inclusive, temos um nível inicial chamado "Confidence", perfeito para quem nunca teve contato com o idioma.' },
            { q: 'Quem são os professores?', a: 'O corpo docente da Alumni é formado por professores altamente qualificados, com certificações internacionais e sólida formação acadêmica. Nossos professores possuem certificações como CELTA, CPE, CAE, DELTA, IELTS, TOEIC, além de licenciatura e pós-graduação em Letras, e ampla experiência no ensino de inglês para adultos, adolescentes e crianças.' },
            { q: 'Como funciona a agenda flexível?', a: 'Após a matrícula e o teste de nivelamento, você receberá acesso ao portal do aluno, com a agenda do seu nível. Todos os níveis possuem aulas de segunda à sexta (entre 07h e 20h) e também aos sábados (entre 08h e 14h). Você irá agendar as aulas pelo seu portal, de acordo com a sua preferência, no melhor dia e horário, até 30min antes do início da aula.' },
            { q: 'As turmas não são fixas?', a: 'Não. E esse é um dos maiores diferenciais do Community. Você agenda suas aulas de acordo com a sua disponibilidade e participa de encontros com alunos e, eventualmente, professores diferentes. Essa dinâmica traz mais flexibilidade para a rotina adulta e torna as conversas mais próximas da vida real. A consistência do aprendizado vem do método, do seu nível e da trilha pedagógica estruturada da Alumni: cada aula segue um conteúdo programático claro, com temas, vocabulário e objetivos definidos, garantindo evolução contínua.' },
            { q: 'O Community tem certificado?', a: 'Sim. Certificação binacional com validade no Brasil e nos Estados Unidos, concedida ao concluir os níveis mediante prova de habilidades.' },
            { q: 'O curso tem suporte pedagógico?', a: 'Sim. Todos os alunos possuem uma ficha pedagógica gerida pelos professores e pela equipe educacional, para acompanhar e otimizar a trajetória de aprendizado. Se o aluno se sentir muito confortável, pouco desafiado ou com dificuldade de acompanhamento, é feita uma abordagem individual de suporte e aprimoramento da jornada.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: 18, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#003080', marginBottom: 6 }}>{item.q}</p>
              <p style={{ fontSize: 13, color: '#4a4a5a', lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO — PRÓXIMOS PASSOS */}
      <div style={{ padding: '32px 48px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 600, color: '#003080', marginBottom: 20 }}>Próximos Passos</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { step: '1', title: 'Confirmação', desc: 'Aceite a proposta e formalize o pagamento.' },
            { step: '2', title: 'Teste de Nivelamento', desc: 'Você faz um teste rápido para identificarmos seu nível ideal entre os 11 níveis do Community.' },
            { step: '3', title: 'Acesso à Plataforma', desc: 'Liberamos seu acesso à plataforma de estudos e você já prepara sua primeira aula na etapa Pre Class.' },
            { step: '4', title: 'Primeira Aula ao Vivo', desc: 'Você agenda no melhor dia e horário e começa a conversar em inglês desde o primeiro encontro.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#003080', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      {data.observacoes && (
        <div style={{ padding: '24px 48px', marginBottom: 24, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 6 }}>Observações</p>
          <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>{data.observacoes}</p>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding: '24px 48px', textAlign: 'center' as const, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/logos/alumni-logo-dark.png" alt="Alumni by Better" style={{ height: 36 }} />
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af' }}>Inglês de verdade — online, ao vivo e com foco em conversação.</p>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>alumni.com.br | contato@alumni.com.br</p>
      </div>

    </div>
  );
}

function TermosConteudo() {
  const s = { title: { fontSize: 16, fontWeight: 700 as const, color: '#003080', marginTop: 24, marginBottom: 8 }, sub: { fontSize: 14, fontWeight: 600 as const, color: '#1a1a2e', marginTop: 16, marginBottom: 6 }, p: { marginBottom: 8 }, ul: { paddingLeft: 20, marginBottom: 8 }, li: { marginBottom: 4 } };
  return (
    <div>
      <h3 style={s.title}>1. Partes Contratantes</h3>
      <h4 style={s.sub}>1.1 Contratada</h4>
      <p style={s.p}>Razão Social: Better Education – Alumni by Better<br/>CNPJ: 53.286.868/0001-66<br/>Endereço: Calçada dos Crisântemos, n18 – Condomínio Centro Comercial de Alphaville, Barueri/SP – CEP 06453-008<br/>Telefone: +55 11 97380-0517</p>
      <h4 style={s.sub}>1.2 Contratante</h4>
      <p style={s.p}>Dados fornecidos pelo contratante após proposta.</p>

      <h3 style={s.title}>2. Objeto do Contrato</h3>
      <p style={s.p}>A CONTRATADA prestará ao CONTRATANTE serviços educacionais de ensino de inglês na modalidade Community (aulas online e ao vivo, em grupo) conforme especificações abaixo:</p>
      <h4 style={s.sub}>2.1 Especificações do Curso</h4>
      <p style={s.p}>Conforme proposta.</p>
      <h4 style={s.sub}>2.2 Recursos Inclusos</h4>
      <ul style={s.ul}>
        <li style={s.li}>Acesso à plataforma digital de estudos Alumni personalizada</li>
        <li style={s.li}>Consultoria avaliativa</li>
        <li style={s.li}>Avaliações periódicas de desempenho</li>
        <li style={s.li}>Certificado de conclusão (mediante solicitação e aproveitamento mínimo de 75% das horas contratadas)</li>
        <li style={s.li}>Suporte pedagógico via chat/e-mail</li>
      </ul>

      <h3 style={s.title}>3. Investimento e Condições de Pagamento</h3>
      <h4 style={s.sub}>3.1 Valor Total e Forma de Pagamento</h4>
      <p style={s.p}>Conforme proposta.</p>
      <h4 style={s.sub}>3.2 Atraso no Pagamento</h4>
      <p style={s.p}>Em caso de atraso, serão aplicados:</p>
      <ul style={s.ul}>
        <li style={s.li}>Multa: 2% sobre o valor da parcela</li>
        <li style={s.li}>Juros: 1% ao mês (pro rata die)</li>
        <li style={s.li}>Suspensão: Acesso à plataforma e aulas será suspenso após 7 dias de inadimplência</li>
      </ul>

      <h3 style={s.title}>4. Agendamento e Realização das Aulas</h3>
      <h4 style={s.sub}>4.1 Cancelamento e Reagendamento</h4>
      <ul style={s.ul}>
        <li style={s.li}>Para cancelamento — mínimo de 48h — caso o pedido seja feito em período inferior ao estipulado a aula será descontada do pacote</li>
        <li style={s.li}>Para reagendamento — mínimo de 24h — caso o pedido seja feito em período inferior ao estipulado a aula será descontada do pacote</li>
        <li style={s.li}>Não é possível reagendar/cancelar uma mesma aula mais de uma vez</li>
      </ul>

      <h3 style={s.title}>5. Validade e Vigência</h3>
      <h4 style={s.sub}>5.1 Período de Utilização</h4>
      <p style={s.p}>De acordo com a proposta. Prorrogação mediante solicitação e aprovação, com cobrança proporcional.</p>
      <h4 style={s.sub}>5.2 Pausas/Trancamento</h4>
      <ul style={s.ul}>
        <li style={s.li}>Permitido 1 trancamento de 15 dias a cada 6 meses de contrato</li>
        <li style={s.li}>Solicitação com 15 dias de antecedência</li>
        <li style={s.li}>Período de trancamento não suspende cobranças das parcelas</li>
      </ul>

      <h3 style={s.title}>6. Política de Cancelamento e Reembolso</h3>
      <h4 style={s.sub}>6.1 Direito de Arrependimento (7 dias - CDC)</h4>
      <p style={s.p}>O CONTRATANTE poderá cancelar o contrato no prazo de até 7 (sete) dias corridos a contar da data da contratação, conforme art. 49 do Código de Defesa do Consumidor.</p>
      <ul style={s.ul}>
        <li style={s.li}>O cancelamento dentro deste prazo garante reembolso integral dos valores pagos</li>
        <li style={s.li}>O reembolso será realizado pelo mesmo meio de pagamento utilizado na contratação</li>
      </ul>
      <h4 style={s.sub}>6.2 Cancelamento Após 7 Dias</h4>
      <p style={s.p}>Após o prazo de arrependimento:</p>
      <ul style={s.ul}>
        <li style={s.li}>O valor referente aos serviços educacionais poderá ser reembolsado conforme o consumo de aulas utilizado pelo CONTRATANTE independentemente da forma de parcelamento. O valor terá como base o valor da hora aula x aulas utilizadas</li>
        <li style={s.li}>Sobre o valor remanescente dos serviços, será aplicada multa de 10% (dez por cento)</li>
        <li style={s.li}>O valor referente aos materiais e plataformas de estudos não são passíveis de cancelamento por se tratar de um produto de acesso vitalício</li>
      </ul>
      <h4 style={s.sub}>6.3 Prazo para Reembolso</h4>
      <p style={s.p}>Quando aplicável, o reembolso será efetuado em até 30 (trinta) dias úteis, contados a partir da solicitação formal de cancelamento, pelo mesmo meio de pagamento utilizado.</p>
      <h4 style={s.sub}>6.4 Disposições Gerais</h4>
      <ul style={s.ul}>
        <li style={s.li}>O cancelamento deve ser solicitado por meio formal indicado pela CONTRATADA através do número (11) 97380-0517 e preenchimento do formulário enviado pelo canal</li>
        <li style={s.li}>A não utilização das aulas ou da plataforma não caracteriza cancelamento automático nem isenta o pagamento das obrigações contratuais</li>
      </ul>

      <h3 style={s.title}>7. Obrigações da Contratada</h3>
      <ul style={s.ul}>
        <li style={s.li}>Fornecer professores qualificados e certificados</li>
        <li style={s.li}>Garantir acesso à plataforma digital 24/7</li>
        <li style={s.li}>Realizar avaliações periódicas de progresso</li>
        <li style={s.li}>Emitir certificado de conclusão (mediante solicitação e aproveitamento ≥ 75%)</li>
        <li style={s.li}>Manter sigilo sobre dados pessoais do aluno (LGPD)</li>
      </ul>

      <h3 style={s.title}>8. Obrigações do Contratante</h3>
      <ul style={s.ul}>
        <li style={s.li}>Efetuar pagamentos nas datas acordadas</li>
        <li style={s.li}>Comparecer/conectar-se pontualmente às aulas agendadas</li>
        <li style={s.li}>Utilizar adequadamente a plataforma e materiais</li>
        <li style={s.li}>Respeitar professores e demais alunos (se aplicável)</li>
        <li style={s.li}>Informar imediatamente problemas técnicos ou pedagógicos</li>
      </ul>

      <h3 style={s.title}>9. Propriedade Intelectual</h3>
      <ul style={s.ul}>
        <li style={s.li}>Todo material didático é propriedade da CONTRATADA</li>
        <li style={s.li}>Proibida reprodução, distribuição ou comercialização</li>
        <li style={s.li}>Uso exclusivo para fins de estudo pessoal</li>
      </ul>

      <h3 style={s.title}>10. Proteção de Dados (LGPD)</h3>
      <ul style={s.ul}>
        <li style={s.li}>Dados coletados exclusivamente para execução do contrato</li>
        <li style={s.li}>Não haverá compartilhamento com terceiros sem autorização</li>
        <li style={s.li}>Aluno pode solicitar exclusão de dados após término do contrato</li>
      </ul>

      <h3 style={s.title}>11. Disposições Gerais</h3>
      <h4 style={s.sub}>11.1 Alterações</h4>
      <p style={s.p}>Alterações contratuais devem ser formalizadas por escrito.</p>
      <h4 style={s.sub}>11.2 Cessão</h4>
      <p style={s.p}>Contrato não pode ser cedido sem anuência das partes.</p>
      <h4 style={s.sub}>11.3 Caso Fortuito/Força Maior</h4>
      <p style={s.p}>Partes isentas de responsabilidade em situações imprevisíveis.</p>
      <h4 style={s.sub}>11.4 Comunicação</h4>
      <ul style={s.ul}>
        <li style={s.li}>Comunicações oficiais via e-mail cadastrado e através do número (11) 97380-0517 via WhatsApp</li>
        <li style={s.li}>Prazo de resposta: 48 horas úteis</li>
      </ul>

      <h3 style={s.title}>12. Foro</h3>
      <p style={s.p}>As partes elegem o foro da Comarca de Barueri/SP para dirimir quaisquer dúvidas oriundas deste contrato.</p>
    </div>
  );
}
