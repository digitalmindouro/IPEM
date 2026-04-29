'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import type { StatusCaderno } from '@/types'

interface Props {
  numero: number
  respostas: Record<string, string | number>
  status: StatusCaderno
}

export default function CadernoViewer({ numero, respostas, status }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)

  const isReadOnly = status === 'aprovado' || status === 'aguardando_aprovacao'

  // Quando o iframe carrega, injeta os dados salvos
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument
        if (!doc) return

        // Aguarda o JS do caderno executar (roda da vida etc)
        setTimeout(() => {
          // Preenche inputs de texto e textareas
          const inputs = doc.querySelectorAll<HTMLInputElement>('input:not([type="range"])')
          const textareas = doc.querySelectorAll<HTMLTextAreaElement>('textarea')
          const sliders = doc.querySelectorAll<HTMLInputElement>('input[type="range"]')

          // Atribui IDs sequenciais
          inputs.forEach((el, i) => { if (!el.id) el.id = `inp_${i}` })
          textareas.forEach((el, i) => { if (!el.id) el.id = `ta_${i}` })

          // Restaura valores salvos
          inputs.forEach((el) => {
            const val = respostas[el.id]
            if (val !== undefined) el.value = String(val)
          })
          textareas.forEach((el) => {
            const val = respostas[el.id]
            if (val !== undefined) el.value = String(val)
          })

          // Restaura sliders e atualiza a roda
          sliders.forEach((el, i) => {
            const key = `slider_${i}`
            if (respostas[key] !== undefined) {
              el.value = String(respostas[key])
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          })

          // Se read-only, desabilita todos os campos
          if (isReadOnly) {
            doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(el => {
              el.disabled = true
              el.style.opacity = '0.6'
              el.style.cursor = 'not-allowed'
            })
          }

          setIframeReady(true)
        }, 400)
      } catch (e) {
        console.error('Erro ao acessar iframe:', e)
        setIframeReady(true)
      }
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [respostas, isReadOnly])

  async function salvar(acao: 'salvar' | 'enviar') {
    if (!iframeRef.current) return
    setLoading(true)

    try {
      const doc = iframeRef.current.contentDocument
      if (!doc) throw new Error('iframe não acessível')

      const data: Record<string, string | number> = {}

      // Coleta inputs de texto
      doc.querySelectorAll<HTMLInputElement>('input:not([type="range"])').forEach(el => {
        if (el.id) data[el.id] = el.value
      })

      // Coleta textareas
      doc.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(el => {
        if (el.id) data[el.id] = el.value
      })

      // Coleta sliders
      doc.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach((el, i) => {
        data[`slider_${i}`] = Number(el.value)
      })

      const res = await fetch('/api/cadernos/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_caderno: numero, respostas: data, acao }),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(result.message)
        if (acao === 'enviar') {
          setTimeout(() => router.push('/membro'), 1500)
        }
      } else {
        toast.error(result.error || 'Erro ao salvar.')
      }
    } catch (e) {
      toast.error('Erro de conexão. Tente novamente.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0e0b' }}>

      {/* Barra superior flutuante */}
      <div style={{
        background: '#1a1713',
        borderBottom: '1px solid rgba(212,168,67,0.15)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 50,
        flexShrink: 0,
      }}>

        {/* Voltar */}
        <button
          onClick={() => router.push('/membro')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: '#7a7060', fontSize: '13px', background: 'none',
            border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px',
          }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase',
            color: '#c8a96e',
          }}>
            Caderno {numero} · I.P.E.M
          </span>
        </div>

        {/* Status badge */}
        {status === 'aguardando_aprovacao' && (
          <span style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.25)',
            color: '#c8a96e', letterSpacing: '1px',
          }}>
            ⏳ Aguardando avaliação
          </span>
        )}

        {status === 'aprovado' && (
          <span style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)',
            color: '#d4a843', letterSpacing: '1px',
          }}>
            ✅ Aprovado
          </span>
        )}

        {status === 'ajustar' && (
          <span style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '100px',
            background: 'rgba(139,58,42,0.1)', border: '1px solid rgba(139,58,42,0.3)',
            color: '#8b3a2a',
          }}>
            ⚠️ Revisar
          </span>
        )}

        {/* Botões de ação */}
        {!isReadOnly && (
          <>
            <button
              onClick={() => salvar('salvar')}
              disabled={loading || !iframeReady}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent',
                border: '1px solid rgba(212,168,67,0.3)',
                color: '#c8a96e', fontSize: '13px', padding: '6px 14px',
                borderRadius: '4px', cursor: 'pointer',
                opacity: loading || !iframeReady ? 0.5 : 1,
              }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Salvar
            </button>

            <button
              onClick={() => salvar('enviar')}
              disabled={loading || !iframeReady}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #c8a96e 0%, #d4a843 50%, #e8c96a 100%)',
                border: 'none',
                color: '#1a1713', fontSize: '13px', fontWeight: '500',
                padding: '6px 16px', borderRadius: '4px', cursor: 'pointer',
                opacity: loading || !iframeReady ? 0.5 : 1,
              }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Enviar para aprovação
            </button>
          </>
        )}
      </div>

      {/* iframe com o caderno original */}
      <iframe
        ref={iframeRef}
        src={`/cadernos/caderno-${numero}.html`}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title={`Caderno ${numero}`}
      />
    </div>
  )
}
