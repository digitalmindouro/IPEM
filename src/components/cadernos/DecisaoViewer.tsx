'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import EvidenciasPanel from './EvidenciasPanel'

type Decisao = 'aprovado' | 'ajustar' | 'reaplicar'

interface Props {
  questionarioId: string
  numero: number
  membroNome: string
  respostas: Record<string, string | number>
}

export default function DecisaoViewer({ questionarioId, numero, membroNome, respostas }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const [decisao, setDecisao] = useState<Decisao | null>(null)
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return

        setTimeout(() => {
          const inputs = doc.querySelectorAll<HTMLInputElement>('input:not([type="range"])')
          const textareas = doc.querySelectorAll<HTMLTextAreaElement>('textarea')
          const sliders = doc.querySelectorAll<HTMLInputElement>('input[type="range"]')

          inputs.forEach((el, i) => { if (!el.id) el.id = `inp_${i}` })
          textareas.forEach((el, i) => { if (!el.id) el.id = `ta_${i}` })

          inputs.forEach(el => { if (respostas[el.id] !== undefined) el.value = String(respostas[el.id]) })
          textareas.forEach(el => { if (respostas[el.id] !== undefined) el.value = String(respostas[el.id]) })
          sliders.forEach((el, i) => {
            if (respostas[`slider_${i}`] !== undefined) {
              el.value = String(respostas[`slider_${i}`])
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          })

          doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(el => {
            el.disabled = true
            el.style.opacity = '0.8'
            el.style.cursor = 'default'
          })
        }, 400)
      } catch (e) {
        console.error(e)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [respostas])

  async function enviarDecisao() {
    if (!decisao) { toast.error('Selecione uma decisão.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/cadernos/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionario_id: questionarioId, decisao, observacao }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        setTimeout(() => router.push('/facilitador/aprovacoes'), 1500)
      } else {
        toast.error(data.error || 'Erro ao enviar decisão.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const opcoes: { value: Decisao; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'aprovado', label: 'Aprovado', desc: 'Cumpriu o caderno com qualidade.', icon: <CheckCircle size={18} strokeWidth={1.5} /> },
    { value: 'ajustar', label: 'Ajustar', desc: 'Precisa revisar partes específicas.', icon: <AlertCircle size={18} strokeWidth={1.5} /> },
    { value: 'reaplicar', label: 'Reaplicar', desc: 'Precisa refazer o caderno completo.', icon: <RefreshCw size={18} strokeWidth={1.5} /> },
  ]

  const corDecisao = (v: Decisao) => v === 'aprovado' ? '#d4a843' : v === 'ajustar' ? '#c8a96e' : '#8b3a2a'

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0e0b', overflow: 'hidden' }}>

      {/* Coluna esquerda — caderno + evidências */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          background: '#1a1713',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
        }}>
          <button
            onClick={() => router.push('/facilitador/aprovacoes')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7a7060', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e' }}>
              Caderno {numero} · {membroNome}
            </span>
          </div>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)', color: '#c8a96e' }}>
            👁 Modo leitura
          </span>
        </div>

        {/* Conteúdo com scroll */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <iframe
            ref={iframeRef}
            src={`/cadernos/caderno-${numero}.html`}
            style={{ width: '100%', height: '900px', border: 'none', display: 'block' }}
            title={`Caderno ${numero}`}
          />

          {/* Evidências do membro */}
          <EvidenciasPanel questionarioId={questionarioId} readOnly={true} />
        </div>
      </div>

      {/* Painel direito — decisão */}
      <div style={{
        width: '320px', background: '#1a1713',
        borderLeft: '1px solid rgba(212,168,67,0.15)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto',
      }}>
        <div style={{ padding: '24px', flex: 1 }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#7a7060', marginBottom: '8px' }}>Validação</p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8', marginBottom: '4px' }}>Avalie o caderno</p>
          <p style={{ fontSize: '12px', color: '#7a7060', marginBottom: '24px' }}>Leia as respostas e evidências antes de decidir.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {opcoes.map(op => (
              <button
                key={op.value}
                onClick={() => setDecisao(op.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '6px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  border: decisao === op.value ? `2px solid ${corDecisao(op.value)}` : '2px solid rgba(255,255,255,0.08)',
                  background: decisao === op.value ? `${corDecisao(op.value)}18` : 'rgba(255,255,255,0.03)',
                  color: decisao === op.value ? corDecisao(op.value) : '#7a7060',
                }}
              >
                <span style={{ marginTop: '1px', flexShrink: 0 }}>{op.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{op.label}</p>
                  <p style={{ fontSize: '11px', opacity: 0.7, lineHeight: '1.4' }}>{op.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#7a7060', display: 'block', marginBottom: '8px' }}>
              Observação {decisao !== 'aprovado' ? '(obrigatória)' : '(opcional)'}
            </label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder={decisao === 'ajustar' ? 'Indique o que revisar...' : decisao === 'reaplicar' ? 'Por que reaplicar...' : 'Mensagem ao membro...'}
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px',
                padding: '10px 12px', color: '#f5f0e8', fontSize: '13px',
                lineHeight: '1.6', resize: 'vertical', outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={enviarDecisao}
            disabled={!decisao || loading || (!observacao && decisao !== 'aprovado')}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: '4px',
              background: !decisao || loading || (!observacao && decisao !== 'aprovado')
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)',
              color: !decisao || loading ? '#7a7060' : '#1a1713',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading && <Loader2 size={15} />}
            {loading ? 'Processando...' : 'Confirmar decisão'}
          </button>
          {!decisao && <p style={{ fontSize: '11px', color: '#7a7060', textAlign: 'center', marginTop: '8px' }}>Selecione uma decisão acima</p>}
          {decisao && decisao !== 'aprovado' && !observacao && <p style={{ fontSize: '11px', color: '#8b3a2a', textAlign: 'center', marginTop: '8px' }}>Adicione uma observação para o membro</p>}
        </div>
      </div>
    </div>
  )
}
