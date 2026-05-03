'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Loader2, CheckCircle, Clock, AlertCircle, CreditCard, FileText } from 'lucide-react'

interface Pagamento {
  id: string
  numero_parcela: number
  valor: number
  data_vencimento: string | null
  data_pagamento: string | null
  pago: boolean
}

interface Parcela {
  id: string
  membro_id: string
  responsavel_id: string
  valor_total: number
  numero_parcelas: number
  valor_parcela: number
  forma_pagamento: string
  parcelas_pagas: number
  status: string
  observacoes: string | null
  created_at: string
  membro: { id: string; nome: string; email: string }
  responsavel: { id: string; nome: string; role: string }
  financeiro_pagamentos: Pagamento[]
}

interface Profile {
  id: string
  nome: string
  email: string
  role: string
}

interface Props {
  userRole: string
  userId: string
  todosProfiles?: Profile[]
  turmas?: { id: string; nome: string }[]
}

const STATUS_COR: Record<string, string> = {
  pendente: '#7a7060',
  parcial: '#c8a96e',
  quitado: '#d4a843',
  inadimplente: '#8b3a2a',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  quitado: 'Quitado',
  inadimplente: 'Inadimplente',
}

export default function FinanceiroPanel({ userRole, userId, todosProfiles = [], turmas = [] }: Props) {
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [loading, setLoading] = useState(true)
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(null)
  const [showNovo, setShowNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Form novo lançamento
  const [membroId, setMembroId] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [valorTotal, setValorTotal] = useState('1500')
  const [numParcelas, setNumParcelas] = useState('1')
  const [formaPgto, setFormaPgto] = useState('cartao')
  const [obs, setObs] = useState('')

  const isMembro = userRole === 'membro'
  const isOrdenista = userRole === 'ordenista'
  const podeGerenciar = ['mentor', 'guardiao', 'ordenista', 'facilitador'].includes(userRole)

  useEffect(() => { carregarParcelas() }, [])

  async function carregarParcelas() {
    setLoading(true)
    try {
      const res = await fetch('/api/financeiro')
      if (res.ok) {
        const data = await res.json()
        setParcelas(data.parcelas)
      }
    } catch { toast.error('Erro ao carregar financeiro.') }
    finally { setLoading(false) }
  }

  async function criarLancamento() {
    if (!membroId || !valorTotal || !numParcelas) { toast.error('Preencha todos os campos obrigatórios.'); return }
    setSalvando(true)
    try {
      const res = await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membro_id: membroId,
          turma_id: turmaId || null,
          valor_total: Number(valorTotal),
          numero_parcelas: Number(numParcelas),
          forma_pagamento: formaPgto,
          observacoes: obs || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Lançamento criado!')
        setShowNovo(false)
        setMembroId(''); setTurmaId(''); setValorTotal('1500'); setNumParcelas('1'); setFormaPgto('cartao'); setObs('')
        await carregarParcelas()
      } else toast.error(data.error || 'Erro ao criar lançamento.')
    } catch { toast.error('Erro de conexão.') }
    finally { setSalvando(false) }
  }

  async function togglePagamento(pagamentoId: string, pago: boolean) {
    try {
      const res = await fetch('/api/financeiro', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamento_id: pagamentoId, pago }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(pago ? 'Parcela marcada como paga!' : 'Parcela desmarcada.')
        // Atualiza localmente
        setParcelas(prev => prev.map(p => {
          if (p.id === parcelaSelecionada?.id) {
            const novosPagementos = p.financeiro_pagamentos.map(pg =>
              pg.id === pagamentoId ? { ...pg, pago, data_pagamento: pago ? new Date().toISOString() : null } : pg
            )
            const updated = { ...p, financeiro_pagamentos: novosPagementos, status: data.status, parcelas_pagas: data.parcelas_pagas }
            setParcelaSelecionada(updated)
            return updated
          }
          return p
        }))
      } else toast.error(data.error || 'Erro.')
    } catch { toast.error('Erro de conexão.') }
  }

  const totalGeral = parcelas.reduce((sum, p) => sum + Number(p.valor_total), 0)
  const totalRecebido = parcelas.reduce((sum, p) => sum + (p.parcelas_pagas * Number(p.valor_parcela)), 0)
  const totalPendente = totalGeral - totalRecebido

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 12px', color: '#f5f0e8', fontSize: '13px', outline: 'none', fontFamily: 'DM Sans, sans-serif' }
  const labelStyle = { fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#7a7060', display: 'block', marginBottom: '6px' }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '4px' }}>Financeiro</p>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#f5f0e8' }}>
            {isMembro ? 'Minhas Parcelas' : 'Gestão Financeira'}
          </h2>
        </div>
        {podeGerenciar && !isMembro && (
          <button onClick={() => setShowNovo(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '13px', fontWeight: '500' }}>
            <Plus size={14} /> Novo Lançamento
          </button>
        )}
      </div>

      {/* Resumo (só para quem gerencia) */}
      {!isMembro && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Lançado', valor: totalGeral, cor: '#f5f0e8' },
            { label: 'Recebido', valor: totalRecebido, cor: '#d4a843' },
            { label: 'Pendente', valor: totalPendente, cor: '#c8a96e' },
          ].map(item => (
            <div key={item.label} className="card-gold" style={{ textAlign: 'center', padding: '16px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: item.cor, marginBottom: '4px' }}>
                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: '10px', color: '#7a7060', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo lançamento */}
      {showNovo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8' }}>Novo Lançamento</p>
              <button onClick={() => setShowNovo(false)} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Membro *</label>
                <select value={membroId} onChange={e => setMembroId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecione...</option>
                  {todosProfiles.filter(p => p.role === 'membro').map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              {turmas.length > 0 && (
                <div>
                  <label style={labelStyle}>Turma</label>
                  <select value={turmaId} onChange={e => setTurmaId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Sem turma</option>
                    {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Valor Total (R$) *</label>
                  <input type="number" value={valorTotal} onChange={e => setValorTotal(e.target.value)} style={inputStyle} placeholder="1500" />
                </div>
                <div>
                  <label style={labelStyle}>Nº de Parcelas *</label>
                  <input type="number" min="1" max="10" value={numParcelas} onChange={e => setNumParcelas(e.target.value)} style={inputStyle} placeholder="1 a 10" />
                </div>
              </div>
              {valorTotal && numParcelas && Number(numParcelas) > 0 && (
                <div style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: '4px', padding: '10px 12px' }}>
                  <p style={{ color: '#c8a96e', fontSize: '12px' }}>
                    {numParcelas}x de R$ {(Number(valorTotal) / Number(numParcelas)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Forma de Pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[['cartao', 'Cartão (sem juros)', CreditCard], ['boleto', 'Boleto (com juros)', FileText]].map(([val, label, Icon]: any) => (
                    <button key={val} onClick={() => setFormaPgto(val)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer', border: formaPgto === val ? '1px solid #d4a843' : '1px solid rgba(255,255,255,0.08)', background: formaPgto === val ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.02)', color: formaPgto === val ? '#d4a843' : '#7a7060', fontSize: '12px' }}>
                      <Icon size={14} />{label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Observações</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} placeholder="Opcional..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNovo(false)} style={{ padding: '10px 16px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#7a7060', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              <button onClick={criarLancamento} disabled={salvando} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '4px', background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)', border: 'none', color: '#1a1713', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {salvando ? <Loader2 size={13} /> : null}{salvando ? 'Salvando...' : 'Criar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhe parcelas */}
      {parcelaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1713', border: '1px solid rgba(212,168,67,0.2)', borderRadius: '8px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#f5f0e8' }}>{parcelaSelecionada.membro?.nome}</p>
                <p style={{ color: '#7a7060', fontSize: '12px' }}>
                  R$ {Number(parcelaSelecionada.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {parcelaSelecionada.numero_parcelas}x · {parcelaSelecionada.forma_pagamento === 'cartao' ? 'Cartão' : 'Boleto'}
                </p>
              </div>
              <button onClick={() => setParcelaSelecionada(null)} style={{ background: 'none', border: 'none', color: '#7a7060', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parcelaSelecionada.financeiro_pagamentos
                .sort((a, b) => a.numero_parcela - b.numero_parcela)
                .map(pg => (
                <div key={pg.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '6px', background: pg.pago ? 'rgba(212,168,67,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${pg.pago ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: pg.pago ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {pg.pago ? <CheckCircle size={14} color="#d4a843" /> : <Clock size={14} color="#7a7060" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: pg.pago ? '#d4a843' : '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>
                      Parcela {pg.numero_parcela}/{parcelaSelecionada.numero_parcelas}
                    </p>
                    <p style={{ color: '#7a7060', fontSize: '11px' }}>
                      R$ {Number(pg.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {pg.data_vencimento && ` · Venc: ${new Date(pg.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                      {pg.pago && pg.data_pagamento && ` · Pago em ${new Date(pg.data_pagamento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  {podeGerenciar && !isMembro && (
                    <button
                      onClick={() => togglePagamento(pg.id, !pg.pago)}
                      style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', border: 'none', background: pg.pago ? 'rgba(255,255,255,0.06)' : 'rgba(212,168,67,0.15)', color: pg.pago ? '#7a7060' : '#d4a843' }}
                    >
                      {pg.pago ? 'Desmarcar' : 'Marcar pago'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de lançamentos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#7a7060' }}>Carregando...</div>
      ) : parcelas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: '#7a7060', fontSize: '13px' }}>
            {isMembro ? 'Nenhuma cobrança registrada para você ainda.' : 'Nenhum lançamento financeiro ainda.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {parcelas.map(p => (
            <div key={p.id} onClick={() => setParcelaSelecionada(p)} className="card-gold" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>
                      {isMembro ? `${p.numero_parcelas}x de R$ ${Number(p.valor_parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : p.membro?.nome}
                    </p>
                    <span style={{ fontSize: '10px', color: STATUS_COR[p.status], background: `${STATUS_COR[p.status]}18`, padding: '2px 8px', borderRadius: '100px', border: `1px solid ${STATUS_COR[p.status]}40` }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p style={{ color: '#7a7060', fontSize: '12px' }}>
                    R$ {Number(p.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {p.parcelas_pagas}/{p.numero_parcelas} pagas · {p.forma_pagamento === 'cartao' ? 'Cartão' : 'Boleto'}
                    {!isMembro && p.responsavel && ` · ${p.responsavel.nome}`}
                  </p>
                </div>
                {/* Barra de progresso */}
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(p.parcelas_pagas / p.numero_parcelas) * 100}%`, background: 'linear-gradient(90deg, #c8a96e, #d4a843)', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '10px', color: '#7a7060', marginTop: '4px', textAlign: 'right' }}>{Math.round((p.parcelas_pagas / p.numero_parcelas) * 100)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
