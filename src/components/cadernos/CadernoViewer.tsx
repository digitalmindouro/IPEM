'use client'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, Loader2, CheckCircle } from 'lucide-react'
import EvidenciasPanel from './EvidenciasPanel'

interface Props {
  numero: number
  questionarioId: string | null
  respostasIniciais: Record<string, string | number>
  status: string
}

export default function CadernoViewer({ numero, questionarioId, respostasIniciais, status }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [qId, setQId] = useState<string | null>(questionarioId)
  const [iframeError, setIframeError] = useState(false)

  const isReadOnly = status === 'aguardando_aprovacao' || status === 'aprovado'
  const mostrarEvidencias = !!qId && (
    status === 'em_andamento' || status === 'aguardando_aprovacao' ||
    status === 'aprovado' || status === 'ajustar' || status === 'reaplicar'
  )

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

          inputs.forEach(el => {
            const val = respostasIniciais[el.id]
            if (val !== undefined) el.value = String(val)
          })
          textareas.forEach(el => {
            const val = respostasIniciais[el.id]
            if (val !== undefined) el.value = String(val)
          })
          sliders.forEach((el, i) => {
            const key = `slider_${i}`
            if (respostasIniciais[key] !== undefined) {
              el.value = String(respostasIniciais[key])
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          })

          // Ocultar seção de validação do facilitador
          const allElements = doc.querySelectorAll('*')
          allElements.forEach(el => {
            const text = el.textContent?.toLowerCase() ?? ''
            if (
              (text.includes('validação') || text.includes('validacao') || text.includes('facilitador')) &&
              el.children.length === 0
            ) {
              let parent = el.parentElement
              for (let i = 0; i < 5 && parent; i++) {
                if (parent.querySelector('input, textarea, select')) {
                  ;(parent as HTMLElement).style.display = 'none'
                  break
                }
                parent = parent.parentElement
              }
            }
          })

          if (isReadOnly) {
            doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
              .forEach(el => {
                el.disabled = true
                el.style.opacity = '0.7'
              })
          }

          setIframeReady(true)
        }, 400)
      } catch (e) {
        console.error('Erro iframe:', e)
        setIframeReady(true)
      }
    }

    const handleError = () => {
      setIframeError(true)
      setIframeReady(true)
    }

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)
    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [respostasIniciais, isReadOnly])

  function coletarRespostas(): Record<string, string | number> {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return {}
    const respostas: Record<string, string | number> = {}
    doc.querySelectorAll<HTMLInputElement>('input:not([type="range"])').forEach(el => {
      if (el.id) respostas[el.id] = el.value
    })
    doc.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(el => {
      if (el.id) respostas[el.id] = el.value
    })
    doc.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((el, i) => {
      respostas[`slider_${i}`] = el.value
    })
    return respostas
  }

  async function salvar() {
    setSalvando(true)
    try {
      const respostas = coletarRespostas()
      const res = await fetch('/api/cadernos/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_caderno: numero, respostas, status: 'em_andamento' }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.questionario?.id) setQId(data.questionario.id)
        toast.success('Progresso salvo!')
      } else {
        toast.error(data.error || 'Erro ao salvar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  async function enviarParaAprovacao() {
    setEnviando(true)
    try {
      const respostas = coletarRespostas()
      const res = await fetch('/api/cadernos/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_caderno: numero, respostas, status: 'aguardando_aprovacao' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Caderno enviado para aprovação!')
        setTimeout(() => router.push('/membro'), 1500)
      } else {
        toast.error(data.error || 'Erro ao enviar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setEnviando(false)
    }
  }

  const statusLabel: Record<string, { text: string; color: string }> = {
    em_andamento: { text: 'Em andamento', color: '#7a7060' },
    aguardando_aprovacao: { text: '⏳ Aguardando aprovação', color: '#c8a96e' },
    aprovado: { text: '✅ Aprovado', color: '#d4a843' },
    ajustar: { text: '⚠️ Revisar partes', color: '#c8a96e' },
    reaplicar: { text: '🔄 Reaplicar', color: '#8b3a2a' },
  }
  const sl = statusLabel[status] ?? statusLabel['em_andamento']

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#0f0e0b',
      zIndex: 50,
    }}>
      {/* Barra superior */}
      <div style={{
        background: '#1a1713',
        borderBottom: '1px solid rgba(212,168,67,0.15)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
        flexShrink: 0,
        height: '48px',
      }}>
        <button
          onClick={() => router.push('/membro')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#7a7060', fontSize: '13px', background: 'none',
            border: 'none', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e' }}>
            Caderno {numero}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: sl.color }}>{sl.text}</span>
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={salvar}
              disabled={salvando}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '4px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f5f0e8', fontSize: '12px',
              }}
            >
              {salvando ? <Loader2 size={13} /> : <Save size={13} />}
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={enviarParaAprovacao}
              disabled={enviando}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '4px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)',
                border: 'none', color: '#1a1713', fontSize: '12px', fontWeight: '500',
              }}
            >
              {enviando ? <Loader2 size={13} /> : <Send size={13} />}
              {enviando ? 'Enviando...' : 'Enviar para aprovação'}
            </button>
          </div>
        )}
        {isReadOnly && status === 'aprovado' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d4a843', fontSize: '12px' }}>
            <CheckCircle size={14} /> Concluído
          </div>
        )}
      </div>

      {/* Área de conteúdo com scroll */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {iframeError ? (
          <div style={{
            height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#7a7060', fontSize: '14px',
          }}>
            Erro ao carregar o caderno. Tente recarregar a página.
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`/cadernos/caderno-${numero}.html`}
            style={{ width: '100%', height: '900px', border: 'none', display: 'block' }}
            title={`Caderno ${numero}`}
          />
        )}

        {mostrarEvidencias ? (
          <EvidenciasPanel questionarioId={qId!} readOnly={isReadOnly} />
        ) : !qId && !isReadOnly ? (
          <div style={{
            background: '#1a1713',
            borderTop: '1px solid rgba(212,168,67,0.15)',
            padding: '24px 32px',
            textAlign: 'center', color: '#7a7060', fontSize: '13px',
          }}>
            Salve o caderno primeiro para poder adicionar evidências.
          </div>
        ) : null}
      </div>
    </div>
  )
}
