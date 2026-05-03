'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Users, ChevronRight, X, Loader2, Search, Trash2, Award } from 'lucide-react'

interface Profile {
  id: string
  nome: string
  email: string
  role: string
}

interface MembroTurma {
  id: string
  membro_id: string
  data_entrada: string
  concluiu: boolean
  membro: Profile
}

interface Turma {
  id: string
  nome: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  max_membros: number | null
  observacoes: string | null
  created_at: string
  membros_turma: MembroTurma[]
}

interface Questionario {
  membro_id: string
  numero_caderno: number
  status: string
}

interface Props {
  profile: Profile
  turmas: Turma[]
  questionarios: Questionario[]
  todosProfiles: Profile[]
}

const CADERNO_LETRA = ['I', 'P', 'E', 'M']

function ProgressoCadernos({ membroId, questionarios }: { membroId: string; questionarios: Questionario[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4].map(num => {
        const q = questionarios.find(q => q.membro_id === membroId && q.numero_caderno === num)
        const status = q?.status
        let bg = 'rgba(255,255,255,0.05)'
        let color = '#7a7060'
        let icon = CADERNO_LETRA[num-1]
        if (status === 'aprovado') { bg = 'rgba(212,168,67,0.2)'; color = '#d4a843'; icon = '✓' }
        else if (status === 'aguardando_aprovacao') { bg = 'rgba(200,169,110,0.15)'; color = '#c8a96e'; icon = '…' }
        else if (status === 'em_andamento') { bg = 'rgba(255,255,255,0.08)'; color = '#f5f0e8' }
        return (
          <div key={num} style={{ width: '28px', height: '28px', borderRadius: '4px', background: bg, color, fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif' }}>
            {icon}
          </div>
        )
      })}
    </div>
  )
}

export default function MentorDashboard({ profile, turmas: turmasIniciais, questionarios, todosProfiles }: Props) {
  const [turmas, setTurmas] = useState<Turma[]>(turmasIniciais)
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null)
  const [showCriarTurma, setShowCriarTurma] = useState(false)
  const [showAdicionarMembro, setShowAdicionarMembro] = useState(false)
  const [buscaMembro, setBuscaMembro] = useState('')
  const [criando, setCriando] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [nomeTurma, setNomeTurma] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [maxMembros, setMaxMembros] = useState('')
  const [obsTurma, setObsTurma] = useState('')

  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' })
  const anoAtual = new Date().getFullYear()
  const nomeDefault = `Turma ${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)} ${anoAtual}`

  async function criarTurma() {
    if (!nomeTurma.trim()) { toast.error('Nome obrigatório'); return }
    setCriando(true)
    try {
      const res = await fetch('/api/turmas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeTurma, data_inicio: dataInicio || null, data_fim: dataFim || null, max_membros: maxMembros || null, observacoes: obsTurma || null }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Turma criada!')
        setTurmas(prev => [{ ...data.turma, membros_turma: [] }, ...prev])
        setShowCriarTurma(false)
        setNomeTurma(''); setDataInicio(''); setDataFim(''); setMaxMembros(''); setObsTurma('')
      } else toast.error(data.error || 'Erro ao criar turma.')
    } catch { toast.error('Erro de conexão.') }
    finally { setCriando(false) }
  }

  async function excluirTurma(turmaId: string) {
    if (!confirm('Excluir esta turma permanentemente?')) return
    const res = await fetch(`/api/turmas/criar?id=${turmaId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Turma excluída.')
      setTurmas(prev => prev.filter(t => t.id !== turmaId))
      if (turmaSelecionada?.id === turmaId) setTurmaSelecionada(null)
    } else toast.error('Erro ao excluir turma.')
  }

  async function adicionarMembro(membroId: string) {
    if (!turmaSelecionada) return
    setAdicionando(true)
    try {
      const res = await fetch('/api/turmas/membros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turma_id: turmaSelecionada.id, membro_id: membroId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Membro adicionado!')
        const membroProfile = todosProfiles.find(p => p.id === membroId)
        const novoMembro: MembroTurma = { id: data.membro_turma.id, membro_id: membroId, data_entrada: new Date().toISOString(), concluiu: false, membro: membroProfile! }
        const turmaAtualizada = { ...turmaSelecionada, membros_turma: [...turmaSelecionada.membros_turma, novoMembro] }
        setTurmaSelecionada(turmaAtualizada)
        setTurmas(prev => prev.map(t => t.id === turmaSelecionada.id ? turmaAtualizada : t))
        setShowAdicionarMembro(false)
        setBuscaMembro('')
      } else toast.error(data.error || 'Erro ao adicionar membro.')
    } catch { toast.error('Erro de conexão.') }
    finally { setAdicionando(false) }
  }

  async function removerMembro(membroId: string) {
    if (!turmaSelecionada || !confirm('Remover membro da turma?')) return
    const res = await fetch(`/api/turmas/membros?turma_id=${turmaSelecionada.id}&membro_id=${membroId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Membro removido.')
      const turmaAtualizada = { ...turmaSelecionada, membros_turma: turmaSelecionada.membros_turma.filter(m => m.membro_id !== membroId) }
      setTurmaSelecionada(turmaAtualizada)
      setTurmas(prev => prev.map(t => t.id === turmaSelecionada.id ? turmaAtualizada : t))
    } else toast.error('Erro ao remover.')
  }

  async function emitirCertificado(membroId: string) {
    if (!confirm('Emitir certificado de conclusão I.P.E.M para este membro?')) return
    try {
      const res = await fetch('/api/ordenista/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: membroId, tipo: 'conclusao_ipem' }),
      })
      const data = await res.json()
      if (res.ok) toast.success(`Certificado emitido! Código: ${data.certificado.codigo_unico}`)
      else toast.error(data.error || 'Erro ao emitir certificado.')
    } catch { toast.error('Erro de conexão.') }
  }

  const membrosDaTurma = turmaSelecionada?.membros_turma.map(m => m.membro_id) ?? []
  const membrosFiltrados = todosProfiles.filter(p =>
    !membrosDaTurma.includes(p.id) &&
    (p.nome.toLowerCase().includes(buscaMembro.toLowerCase()) || p.email.toLowerCase().includes(buscaMembro.toLowerCase()))
  )

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 12px', color: '#f5f0e8', fontSize: '13px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }
  const labelStyle = { fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#7a7060', display: 'block', marginBottom: '6px' }

  return (
    <div className="max-w-4xl">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-2">Mentor</p>
          <h1 className="font-display text-4xl text-paper mb-2">Gestão de Turmas</h1>
          <p className="text-muted text-sm">{turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'}</p>
        </div>
        <button onClick={() => { setShowCriarTurma(true); setNomeTurma(nomeDefault) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '13px', fontWeight: '500' }}>
          <Plus size={14} /> Nova Turma
        </button>
      </div>

      {showCriarTurma && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8' }}>Nova Turma</p>
              <button onClick={() => setShowCriarTurma(false)} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={labelStyle}>Nome da turma *</label><input value={nomeTurma} onChange={e => setNomeTurma(e.target.value)} style={inputStyle} placeholder={nomeDefault} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={labelStyle}>Data início</label><input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} /></div>
                <div><label style={labelStyle}>Data fim</label><input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Máximo de membros</label><input type="number" value={maxMembros} onChange={e => setMaxMembros(e.target.value)} style={inputStyle} placeholder="Sem limite" /></div>
              <div><label style={labelStyle}>Observações</label><textarea value={obsTurma} onChange={e => setObsTurma(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Opcional..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCriarTurma(false)} style={{ padding: '10px 16px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#7a7060', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarTurma} disabled={criando} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '4px', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {criando ? <Loader2 size={13} /> : null}{criando ? 'Criando...' : 'Criar Turma'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!turmaSelecionada ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {turmas.length === 0 ? (
            <div className="card-gold" style={{ textAlign: 'center', padding: '48px' }}>
              <Users size={32} style={{ color: '#7a7060', margin: '0 auto 12px' }} />
              <p style={{ color: '#7a7060', fontSize: '14px' }}>Nenhuma turma criada ainda.</p>
            </div>
          ) : turmas.map(turma => (
            <div key={turma.id} onClick={() => setTurmaSelecionada(turma)} className="card-gold" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', flexShrink: 0 }}>
                  <Users size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f5f0e8', fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{turma.nome}</p>
                  <p style={{ color: '#7a7060', fontSize: '12px' }}>{turma.membros_turma?.length ?? 0} {turma.membros_turma?.length === 1 ? 'membro' : 'membros'}{turma.data_inicio && ` · Início: ${new Date(turma.data_inicio).toLocaleDateString('pt-BR')}`}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={e => { e.stopPropagation(); excluirTurma(turma.id) }} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} style={{ color: '#7a7060' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => setTurmaSelecionada(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a7060', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '24px' }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8', marginBottom: '4px' }}>{turmaSelecionada.nome}</h2>
              <p style={{ color: '#7a7060', fontSize: '13px' }}>{turmaSelecionada.membros_turma.length} membros{turmaSelecionada.data_inicio && ` · ${new Date(turmaSelecionada.data_inicio).toLocaleDateString('pt-BR')}`}{turmaSelecionada.data_fim && ` → ${new Date(turmaSelecionada.data_fim).toLocaleDateString('pt-BR')}`}</p>
            </div>
            <button onClick={() => setShowAdicionarMembro(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '12px', fontWeight: '500' }}>
              <Plus size={13} /> Adicionar membro
            </button>
          </div>

          {showAdicionarMembro && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '440px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f5f0e8' }}>Adicionar Membro</p>
                  <button onClick={() => { setShowAdicionarMembro(false); setBuscaMembro('') }} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#7a7060' }} />
                  <input value={buscaMembro} onChange={e => setBuscaMembro(e.target.value)} placeholder="Buscar por nome ou email..." style={{ ...inputStyle, paddingLeft: '32px' }} autoFocus />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {membrosFiltrados.length === 0 ? (
                    <p style={{ color: '#7a7060', fontSize: '13px', textAlign: 'center', padding: '20px' }}>{buscaMembro ? 'Nenhum resultado.' : 'Todos os membros já estão na turma.'}</p>
                  ) : membrosFiltrados.map(p => (
                    <button key={p.id} onClick={() => adicionarMembro(p.id)} disabled={adicionando} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: '#f5f0e8' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '500' }}>{p.nome}</p>
                        <p style={{ fontSize: '11px', color: '#7a7060' }}>{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {turmaSelecionada.membros_turma.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: '#7a7060', fontSize: '13px' }}>Nenhum membro nesta turma ainda.</p>
              </div>
            ) : turmaSelecionada.membros_turma.map(mt => {
              const totalAprovados = questionarios.filter(q => q.membro_id === mt.membro_id && q.status === 'aprovado').length
              const concluiu = totalAprovados === 4
              return (
                <div key={mt.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
                    {mt.membro?.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>{mt.membro?.nome}</p>
                    <ProgressoCadernos membroId={mt.membro_id} questionarios={questionarios} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {concluiu && (
                      <button
                        onClick={() => emitirCertificado(mt.membro_id)}
                        title="Emitir certificado de conclusão"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: '#d4a843', fontSize: '11px', cursor: 'pointer' }}
                      >
                        <Award size={12} /> Certificado
                      </button>
                    )}
                    <button onClick={() => removerMembro(mt.membro_id)} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer', padding: '4px' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
