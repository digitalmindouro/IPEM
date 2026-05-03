'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, Award, BarChart2, Shield, ChevronRight, X, Loader2, RefreshCw } from 'lucide-react'

interface Profile {
  id: string
  nome: string
  email: string
  role: string
  created_at: string
}

interface Turma {
  id: string
  nome: string
  status: string
  responsavel: Profile
  membros_turma: { id: string; membro_id: string }[]
  created_at: string
}

interface Questionario {
  membro_id: string
  numero_caderno: number
  status: string
}

interface Certificado {
  id: string
  tipo: string
  codigo_unico: string
  data_emissao: string
  membro: Profile
  emissor: Profile
  dados: any
}

interface Props {
  membros: Profile[]
  facilitadores: Profile[]
  mentores: Profile[]
  guardioes: Profile[]
  turmas: Turma[]
  questionarios: Questionario[]
  certificados: Certificado[]
  todosProfiles: Profile[]
}

const ROLES_LABEL: Record<string, string> = {
  membro: 'Membro',
  facilitador: 'Facilitador',
  mentor: 'Mentor',
  guardiao: 'Guardião',
  ordenista: 'Ordenista',
}

const PROXIMA_ROLE: Record<string, string> = {
  membro: 'facilitador',
  facilitador: 'mentor',
  mentor: 'guardiao',
  guardiao: 'ordenista',
}

function cadernos4Aprovados(membroId: string, questionarios: Questionario[]) {
  const aprovados = questionarios.filter(q => q.membro_id === membroId && q.status === 'aprovado')
  return aprovados.length === 4
}

export default function OrdenistaDashboard({
  membros, facilitadores, mentores, guardioes,
  turmas, questionarios, certificados: certIniciais, todosProfiles
}: Props) {
  const [aba, setAba] = useState<'visao' | 'pessoas' | 'turmas' | 'certificados'>('visao')
  const [promovendo, setPromovendo] = useState<string | null>(null)
  const [emitindo, setEmitindo] = useState<string | null>(null)
  const [certificados, setCertificados] = useState(certIniciais)
  const [showEmitir, setShowEmitir] = useState(false)
  const [membroSelecionado, setMembroSelecionado] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState(todosProfiles)

  const total = profiles.length

  async function promoverMembro(membroId: string, roleAtual: string) {
    const novaRole = PROXIMA_ROLE[roleAtual]
    if (!novaRole) return
    if (!confirm(`Promover este usuário para ${ROLES_LABEL[novaRole]}?`)) return
    setPromovendo(membroId)
    try {
      const res = await fetch('/api/ordenista/promover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: membroId, nova_role: novaRole }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Promovido para ${ROLES_LABEL[novaRole]}!`)
        setProfiles(prev => prev.map(p => p.id === membroId ? { ...p, role: novaRole } : p))
      } else {
        toast.error(data.error || 'Erro ao promover.')
      }
    } catch { toast.error('Erro de conexão.') }
    finally { setPromovendo(null) }
  }

  async function emitirCertificado(membroId: string, tipo: string) {
    setEmitindo(membroId)
    try {
      const res = await fetch('/api/ordenista/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membro_id: membroId, tipo }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Certificado emitido!')
        setCertificados(prev => [data.certificado, ...prev])
        setShowEmitir(false)
        setMembroSelecionado(null)
      } else {
        toast.error(data.error || 'Erro ao emitir.')
      }
    } catch { toast.error('Erro de conexão.') }
    finally { setEmitindo(null) }
  }

  const abaStyle = (a: string) => ({
    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
    fontWeight: aba === a ? '500' : '400',
    background: aba === a ? 'rgba(212,168,67,0.15)' : 'transparent',
    border: aba === a ? '1px solid rgba(212,168,67,0.3)' : '1px solid transparent',
    color: aba === a ? '#d4a843' : '#7a7060',
  })

  const gruposPorRole = [
    { label: 'Membros', role: 'membro', lista: profiles.filter(p => p.role === 'membro'), cor: '#7a7060', icon: Users },
    { label: 'Facilitadores', role: 'facilitador', lista: profiles.filter(p => p.role === 'facilitador'), cor: '#c8a96e', icon: Users },
    { label: 'Mentores', role: 'mentor', lista: profiles.filter(p => p.role === 'mentor'), cor: '#d4a843', icon: BarChart2 },
    { label: 'Guardiões', role: 'guardiao', lista: profiles.filter(p => p.role === 'guardiao'), cor: '#f5f0e8', icon: Shield },
  ]

  return (
    <div className="max-w-5xl">
      <div style={{ marginBottom: '28px' }}>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">Ordenista</p>
        <h1 className="font-display text-4xl text-paper mb-2">Painel do Ordenista</h1>
        <p className="text-muted text-sm">{total} pessoas no sistema · {turmas.length} turmas · {certificados.length} certificados</p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
        {([['visao', 'Visão Geral'], ['pessoas', 'Pessoas'], ['turmas', 'Turmas'], ['certificados', 'Certificados']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAba(key)} style={abaStyle(key)}>{label}</button>
        ))}
      </div>

      {/* VISÃO GERAL */}
      {aba === 'visao' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Membros', valor: profiles.filter(p => p.role === 'membro').length, cor: '#7a7060' },
              { label: 'Facilitadores', valor: profiles.filter(p => p.role === 'facilitador').length, cor: '#c8a96e' },
              { label: 'Mentores', valor: profiles.filter(p => p.role === 'mentor').length, cor: '#d4a843' },
              { label: 'Guardiões', valor: profiles.filter(p => p.role === 'guardiao').length, cor: '#f5f0e8' },
            ].map(item => (
              <div key={item.label} className="card-gold" style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: item.cor, marginBottom: '4px' }}>{item.valor}</p>
                <p style={{ fontSize: '10px', color: '#7a7060', textTransform: 'uppercase', letterSpacing: '2px' }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Membros prontos para promover */}
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '12px' }}>
            Prontos para Promoção
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profiles.filter(p => p.role === 'membro' && cadernos4Aprovados(p.id, questionarios)).map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '13px', fontWeight: '600' }}>
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>{p.nome}</p>
                  <p style={{ color: '#d4a843', fontSize: '11px' }}>4 cadernos aprovados · pronto para Facilitador</p>
                </div>
                <button
                  onClick={() => promoverMembro(p.id, p.role)}
                  disabled={promovendo === p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '4px', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}
                >
                  {promovendo === p.id ? <Loader2 size={12} /> : <RefreshCw size={12} />}
                  Promover
                </button>
              </div>
            ))}
            {profiles.filter(p => p.role === 'membro' && cadernos4Aprovados(p.id, questionarios)).length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#7a7060', fontSize: '13px' }}>Nenhum membro pronto para promoção ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESSOAS */}
      {aba === 'pessoas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {gruposPorRole.map(({ label, role, lista, cor }) => (
            <div key={role}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: cor }}>{label}</p>
                <span style={{ fontSize: '11px', color: '#7a7060' }}>({lista.length})</span>
              </div>
              {lista.length === 0 ? (
                <p style={{ color: '#7a7060', fontSize: '13px', padding: '12px 0' }}>Nenhum {label.toLowerCase().slice(0,-1)} ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {lista.map(p => {
                    const aprovados = questionarios.filter(q => q.membro_id === p.id && q.status === 'aprovado').length
                    const podePromover = PROXIMA_ROLE[role] && (role !== 'membro' || aprovados === 4)
                    return (
                      <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,168,67,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cor, fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
                          {p.nome.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>{p.nome}</p>
                          <p style={{ color: '#7a7060', fontSize: '11px' }}>{p.email} · {new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        {role === 'membro' && (
                          <span style={{ fontSize: '11px', color: aprovados === 4 ? '#d4a843' : '#7a7060' }}>
                            {aprovados}/4 cadernos
                          </span>
                        )}
                        {podePromover && (
                          <button
                            onClick={() => promoverMembro(p.id, role)}
                            disabled={promovendo === p.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '4px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: '#d4a843', fontSize: '11px', cursor: 'pointer' }}
                          >
                            {promovendo === p.id ? <Loader2 size={11} /> : '↑'}
                            {ROLES_LABEL[PROXIMA_ROLE[role]]}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TURMAS */}
      {aba === 'turmas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {turmas.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: '#7a7060', fontSize: '13px' }}>Nenhuma turma criada ainda.</p>
            </div>
          ) : turmas.map(turma => (
            <div key={turma.id} className="card-gold">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{turma.nome}</p>
                    <span style={{ fontSize: '10px', color: turma.status === 'ativa' ? '#d4a843' : '#7a7060', background: turma.status === 'ativa' ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(212,168,67,0.2)' }}>
                      {turma.status}
                    </span>
                  </div>
                  <p style={{ color: '#7a7060', fontSize: '12px' }}>
                    Responsável: {turma.responsavel?.nome ?? '—'} ({ROLES_LABEL[turma.responsavel?.role ?? ''] ?? '—'}) · {turma.membros_turma?.length ?? 0} membros
                  </p>
                </div>
                <p style={{ color: '#7a7060', fontSize: '11px' }}>{new Date(turma.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICADOS */}
      {aba === 'certificados' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ color: '#7a7060', fontSize: '13px' }}>{certificados.length} certificados emitidos</p>
            <button
              onClick={() => setShowEmitir(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '4px', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
            >
              <Award size={13} /> Emitir Certificado
            </button>
          </div>

          {/* Modal emitir certificado */}
          {showEmitir && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '440px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8' }}>Emitir Certificado</p>
                  <button onClick={() => { setShowEmitir(false); setMembroSelecionado(null) }} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {!membroSelecionado ? (
                  <div>
                    <p style={{ fontSize: '12px', color: '#7a7060', marginBottom: '12px' }}>Selecione o membro:</p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {todosProfiles.filter(p => p.role !== 'ordenista').map(p => (
                        <button key={p.id} onClick={() => setMembroSelecionado(p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', cursor: 'pointer', color: '#f5f0e8' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px' }}>{p.nome}</p>
                            <p style={{ fontSize: '11px', color: '#7a7060' }}>{ROLES_LABEL[p.role]}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ padding: '12px', background: 'rgba(212,168,67,0.05)', borderRadius: '6px', border: '1px solid rgba(212,168,67,0.15)', marginBottom: '20px' }}>
                      <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{membroSelecionado.nome}</p>
                      <p style={{ color: '#7a7060', fontSize: '12px' }}>{ROLES_LABEL[membroSelecionado.role]}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#7a7060', marginBottom: '12px' }}>Tipo de certificado:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { tipo: 'conclusao_ipem', label: 'Conclusão I.P.E.M', desc: 'Concluiu os 4 cadernos com aprovação' },
                        { tipo: 'formacao_facilitador', label: 'Formação Facilitador', desc: 'Validou 3 membros como Facilitador' },
                        { tipo: 'formacao_mentor', label: 'Formação Mentor', desc: 'Certificado de Mentor' },
                        { tipo: 'formacao_guardiao', label: 'Formação Guardião', desc: 'Certificado de Guardião' },
                      ].map(({ tipo, label, desc }) => (
                        <button
                          key={tipo}
                          onClick={() => emitirCertificado(membroSelecionado.id, tipo)}
                          disabled={emitindo === membroSelecionado.id}
                          style={{ padding: '12px 14px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', color: '#f5f0e8' }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{label}</p>
                          <p style={{ fontSize: '11px', color: '#7a7060' }}>{desc}</p>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setMembroSelecionado(null)} style={{ marginTop: '12px', fontSize: '12px', color: '#7a7060', background: 'none', border: 'none', cursor: 'pointer' }}>← Voltar</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de certificados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {certificados.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                <Award size={28} style={{ color: '#7a7060', margin: '0 auto 12px' }} />
                <p style={{ color: '#7a7060', fontSize: '13px' }}>Nenhum certificado emitido ainda.</p>
              </div>
            ) : certificados.map(cert => (
              <div key={cert.id} className="card-gold" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', flexShrink: 0 }}>
                  <Award size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>{cert.membro?.nome}</p>
                  <p style={{ color: '#7a7060', fontSize: '11px' }}>
                    {cert.tipo?.replace(/_/g, ' ')} · Código: {cert.codigo_unico} · {new Date(cert.data_emissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p style={{ fontSize: '11px', color: '#7a7060', flexShrink: 0 }}>por {cert.emissor?.nome}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
