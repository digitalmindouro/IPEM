'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Award, Loader2, X } from 'lucide-react'

interface Profile {
  id: string
  nome: string
  email: string
  role: string
}

interface Questionario {
  membro_id: string
  numero_caderno: number
  status: string
}

interface Aprovacao {
  validador_id: string
  decisao: string
}

interface Props {
  role: string
  userId: string
  membros: Profile[]
  facilitadores: Profile[]
  mentores: Profile[]
  questionarios: Questionario[]
  aprovacoes: Aprovacao[]
  meusAprovados: number
  minhasValidacoes: number
}

const CADERNO_LETRA = ['I', 'P', 'E', 'M']

const ROLES_PODEM_EMITIR: Record<string, string[]> = {
  mentor: ['membro', 'facilitador'],
  guardiao: ['membro', 'facilitador', 'mentor'],
  ordenista: ['membro', 'facilitador', 'mentor', 'guardiao'],
}

const TIPOS_CERT: Record<string, { tipo: string; label: string }[]> = {
  membro: [{ tipo: 'conclusao_ipem', label: 'Conclusão I.P.E.M' }],
  facilitador: [
    { tipo: 'conclusao_ipem', label: 'Conclusão I.P.E.M' },
    { tipo: 'formacao_facilitador', label: 'Formação Facilitador' },
  ],
  mentor: [
    { tipo: 'formacao_mentor', label: 'Formação Mentor' },
  ],
  guardiao: [
    { tipo: 'formacao_guardiao', label: 'Formação Guardião' },
  ],
}

function ProgressoCadernos({ membroId, questionarios }: { membroId: string; questionarios: Questionario[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4].map(num => {
        const q = questionarios.find(q => q.membro_id === membroId && q.numero_caderno === num)
        const status = q?.status
        let bg = 'rgba(255,255,255,0.05)'
        let color = '#7a7060'
        let icon = CADERNO_LETRA[num - 1]
        if (status === 'aprovado') { bg = 'rgba(212,168,67,0.2)'; color = '#d4a843'; icon = '✓' }
        else if (status === 'aguardando_aprovacao') { bg = 'rgba(200,169,110,0.15)'; color = '#c8a96e'; icon = '…' }
        else if (status === 'em_andamento') { bg = 'rgba(255,255,255,0.08)'; color = '#f5f0e8' }
        return (
          <div key={num} style={{ width: '24px', height: '24px', borderRadius: '4px', background: bg, color, fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif' }}>
            {icon}
          </div>
        )
      })}
    </div>
  )
}

function CriterioCard({ label, desc, ok }: { label: string; desc: string; ok?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', borderRadius: '6px', background: ok ? 'rgba(212,168,67,0.05)' : 'transparent', border: ok ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
      <p style={{ color: ok ? '#d4a843' : '#f5f0e8', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{ok ? '✓ ' : ''}{label}</p>
      <p style={{ color: '#7a7060', fontSize: '11px' }}>{desc}</p>
    </div>
  )
}

export default function FormacaoClient({ role, userId, membros, facilitadores, mentores, questionarios, aprovacoes, meusAprovados, minhasValidacoes }: Props) {
  const [emitindo, setEmitindo] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Profile | null>(null)

  const podeEmitirPara = ROLES_PODEM_EMITIR[role] ?? []

  async function emitirCertificado(membroId: string, tipo: string) {
    setEmitindo(membroId + tipo)
    try {
      const res = await fetch('/api/ordenista/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: membroId, tipo }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Certificado emitido! Código: ${data.certificado.codigo_unico}`)
        setShowModal(false)
        setPessoaSelecionada(null)
      } else {
        toast.error(data.error || 'Erro ao emitir.')
      }
    } catch { toast.error('Erro de conexão.') }
    finally { setEmitindo(null) }
  }

  function abrirModal(pessoa: Profile) {
    setPessoaSelecionada(pessoa)
    setShowModal(true)
  }

  function GrupoFormacao({ titulo, cor, pessoas, rolePessoa }: { titulo: string; cor: string; pessoas: Profile[]; rolePessoa: string }) {
    if (pessoas.length === 0) return null
    const podeEmitir = podeEmitirPara.includes(rolePessoa)
    return (
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: cor, marginBottom: '12px' }}>
          {titulo} ({pessoas.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pessoas.map(p => {
            const aprovados = questionarios.filter(q => q.membro_id === p.id && q.status === 'aprovado').length
            const validacoes = aprovacoes.filter(a => a.validador_id === p.id && a.decisao === 'aprovado').length
            return (
              <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cor, fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>{p.nome}</p>
                    <span style={{ fontSize: '10px', color: cor, background: `${cor}15`, padding: '1px 6px', borderRadius: '100px' }}>{rolePessoa}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ProgressoCadernos membroId={p.id} questionarios={questionarios} />
                    {rolePessoa === 'facilitador' && (
                      <span style={{ fontSize: '11px', color: validacoes >= 3 ? '#d4a843' : '#7a7060' }}>
                        {validacoes}/3 validados
                      </span>
                    )}
                  </div>
                </div>
                {podeEmitir && (
                  <button
                    onClick={() => abrirModal(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: '#d4a843', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Award size={12} /> Certificado
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div style={{ marginBottom: '28px' }}>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">
          {role === 'guardiao' ? 'Guardião' : role === 'mentor' ? 'Mentor' : role === 'ordenista' ? 'Ordenista' : 'Membro'}
        </p>
        <h1 className="font-display text-4xl text-paper mb-2">Formação</h1>
        <p className="text-muted text-sm">Trilha de crescimento no Ordenismo.</p>
      </div>

      {/* Modal emitir certificado */}
      {showModal && pessoaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f5f0e8' }}>Emitir Certificado</p>
              <button onClick={() => { setShowModal(false); setPessoaSelecionada(null) }} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '12px', background: 'rgba(212,168,67,0.05)', borderRadius: '6px', border: '1px solid rgba(212,168,67,0.15)', marginBottom: '20px' }}>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{pessoaSelecionada.nome}</p>
              <p style={{ color: '#7a7060', fontSize: '12px' }}>{pessoaSelecionada.role}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#7a7060', marginBottom: '12px' }}>Selecione o tipo:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(TIPOS_CERT[pessoaSelecionada.role] ?? []).map(({ tipo, label }) => (
                <button
                  key={tipo}
                  onClick={() => emitirCertificado(pessoaSelecionada.id, tipo)}
                  disabled={emitindo === pessoaSelecionada.id + tipo}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#f5f0e8' }}
                >
                  {emitindo === pessoaSelecionada.id + tipo ? <Loader2 size={14} /> : <Award size={14} color="#d4a843" />}
                  <p style={{ fontSize: '13px' }}>{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEU PROGRESSO */}
      {['membro', 'facilitador', 'mentor'].includes(role) && (
        <div className="card-gold" style={{ marginBottom: '28px', padding: '24px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '16px' }}>Seu Progresso</p>
          {role === 'membro' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Facilitador</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <CriterioCard label="4 cadernos aprovados" desc={`${meusAprovados}/4 concluídos`} ok={meusAprovados === 4} />
                <CriterioCard label="Aprovação do Mentor" desc="Validação manual" />
              </div>
            </div>
          )}
          {role === 'facilitador' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Mentor</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <CriterioCard label="4 cadernos aprovados" desc={`${meusAprovados}/4`} ok={meusAprovados === 4} />
                <CriterioCard label="3 membros validados" desc={`${minhasValidacoes}/3`} ok={minhasValidacoes >= 3} />
                <CriterioCard label="Formação R$5.000" desc="Investimento confirmado" />
              </div>
            </div>
          )}
          {role === 'mentor' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Guardião</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <CriterioCard label="Histórico comprovado" desc="Como mentor" ok={true} />
                <CriterioCard label="Mentores formados" desc="Mínimo 1" ok={mentores.length > 0} />
                <CriterioCard label="Formação R$10.000" desc="Investimento confirmado" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISÃO GERAL */}
      {['mentor', 'guardiao', 'ordenista'].includes(role) && (
        <div>
          <GrupoFormacao titulo="Membros" cor="#7a7060" pessoas={membros} rolePessoa="membro" />
          <GrupoFormacao titulo="Facilitadores em Formação" cor="#c8a96e" pessoas={facilitadores} rolePessoa="facilitador" />
          {['guardiao', 'ordenista'].includes(role) && (
            <GrupoFormacao titulo="Mentores em Formação" cor="#d4a843" pessoas={mentores} rolePessoa="mentor" />
          )}
        </div>
      )}

      {role === 'membro' && meusAprovados < 4 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: '#7a7060', fontSize: '13px' }}>Complete os 4 cadernos para avançar na trilha de formação.</p>
        </div>
      )}
    </div>
  )
}
