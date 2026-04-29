'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

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
  const [iframeReady, setIframeReady] = useState(false)

  // Injeta as respostas do membro no iframe (somente leitura)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return

        setTimeout(() => {
          // Preenche todos os campos com as respostas do membro
          const inputs = doc.querySelectorAll<HTMLInputElement>('input:not([type="range"])')
          const textareas = doc.querySelectorAll<HTMLTextAreaElement>('textarea')
          const sliders = doc.querySelectorAll<HTMLInputElement>('input[type="range"]')

          inputs.forEach((el, i) => { if (!el.id) el.id = `inp_${i}` })
          textareas.forEach((el, i) => { if (!el.id) el.id = `ta_${i}` })

          inputs.forEach(el => {
            const val = respostas[el.id]
            if (val !== undefined) el.value = String(val)
          })
          textareas.forEach(el => {
            const val = respostas[el.id]
            if (val !== undefined) el.value = String(val)
          })
          sliders.forEach((el, i) => {
            const key = `slider_${i}`
            if (respostas[key] !== undefined) {
              el.value = String(respostas[key])
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          })

          // Bloqueia edição — o mediador só lê
          doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
            'input, textarea'
          ).forEach(el => {
            el.disabled = true
            el.style.opacity = '0.8'
            el.style.cursor = 'default'
          })

          setIframeReady(true)
        }, 400)
      } catch (e) {
        console.error('Erro ao acessar iframe:', e)
        setIframeReady(true)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [respostas])

  async function enviarDecisao() {
    if (!decisao) {
      toast.error('Selecione uma decisão antes de confirmar.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/cadernos/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionario_id: questionarioId,
          decisao,
          observacao,
        }),
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

  const opcoes: { value: Decisao; label: string; desc: string; icon: React.ReactNode; cor: string }[] = [
    {
      value: 'aprovado',
      label: 'Aprovado',
      desc: 'O membro cumpriu o caderno com qualidade.',
      icon: <CheckCircle size={18} strokeWidth={1.5} />,
      cor: 'border-gold/50 bg-gold/10 text-gold',
    },
    {
      value: 'ajustar',
      label: 'Ajustar',
      desc: 'O membro precisa revisar partes específicas.',
      icon: <AlertCircle size={18} strokeWidth={1.5} />,
      cor: 'border-warm/50 bg-warm/10 text-warm',
    },
    {
      value: 'reaplicar',
      label: 'Reaplicar',
      desc: 'O membro precisa refazer o caderno completo.',
      icon: <RefreshCw size={18} strokeWidth={1.5} />,
      cor: 'border-accent/50 bg-accent/10 text-accent',
    },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0e0b', overflow: 'hidden' }}>

      {/* Painel esquerdo — caderno do membro */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          background: '#1a1713',
          borderBottom: '1px solid rgba(212,168,67,0.15)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => router.push('/facilitador/aprovacoes')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#7a7060', fontSize: '13px', background: 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e' }}>
              Caderno {numero} · {membroNome}
            </span>
          </div>
          <span style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)',
            color: '#c8a96e',
          }}>
            👁 Modo leitura
          </span>
        </div>

        {/* iframe */}
        <iframe
          ref={iframeRef}
          src={`/cadernos/caderno-${numero}.html`}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title={`Caderno ${numero} — ${membroNome}`}
        />
      </div>

      {/* Painel direito — decisão */}
      <div style={{
        width: '320px',
        background: '#1a1713',
        borderLeft: '1px solid rgba(212,168,67,0.15)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'auto',
      }}>
        <div style={{ padding: '24px', flex: 1 }}>

          {/* Título */}
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#7a7060', marginBottom: '8px' }}>
            Validação
          </p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', color: '#f5f0e8', marginBottom: '4px' }}>
            Avalie o caderno
          </p>
          <p style={{ fontSize: '12px', color: '#7a7060', marginBottom: '24px' }}>
            Leia as respostas do membro e tome sua decisão.
          </p>

          {/* Opções de decisão */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {opcoes.map(op => (
              <button
                key={op.value}
                onClick={() => setDecisao(op.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '6px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  border: decisao === op.value
                    ? `2px solid ${op.value === 'aprovado' ? '#d4a843' : op.value === 'ajustar' ? '#c8a96e' : '#8b3a2a'}`
                    : '2px solid rgba(255,255,255,0.08)',
                  background: decisao === op.value
                    ? op.value === 'aprovado' ? 'rgba(212,168,67,0.1)' : op.value === 'ajustar' ? 'rgba(200,169,110,0.1)' : 'rgba(139,58,42,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  color: decisao === op.value
                    ? op.value === 'aprovado' ? '#d4a843' : op.value === 'ajustar' ? '#c8a96e' : '#8b3a2a'
                    : '#7a7060',
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

          {/* Observação */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase',
              color: '#7a7060', display: 'block', marginBottom: '8px',
            }}>
              Observação {decisao !== 'aprovado' ? '(obrigatória)' : '(opcional)'}
            </label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder={
                decisao === 'ajustar'
                  ? 'Indique quais partes precisam ser revisadas...'
                  : decisao === 'reaplicar'
                  ? 'Explique por que o caderno precisa ser refeito...'
                  : 'Mensagem de encorajamento (opcional)...'
              }
              rows={4}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px', padding: '10px 12px',
                color: '#f5f0e8', fontSize: '13px', lineHeight: '1.6',
                resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Botão confirmar */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={enviarDecisao}
            disabled={!decisao || loading || (!observacao && decisao !== 'aprovado')}
            style={{
              width: '100%', padding: '12px',
              background: !decisao || loading || (!observacao && decisao !== 'aprovado')
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #c8a96e 0%, #d4a843 50%, #e8c96a 100%)',
              border: 'none', borderRadius: '4px',
              color: !decisao || loading ? '#7a7060' : '#1a1713',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader2 size={15} /> : null}
            {loading ? 'Processando...' : 'Confirmar decisão'}
          </button>

          {!decisao && (
            <p style={{ fontSize: '11px', color: '#7a7060', textAlign: 'center', marginTop: '8px' }}>
              Selecione uma decisão acima
            </p>
          )}
          {decisao && decisao !== 'aprovado' && !observacao && (
            <p style={{ fontSize: '11px', color: '#8b3a2a', textAlign: 'center', marginTop: '8px' }}>
              Adicione uma observação para o membro
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
