'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, Trash2, FileText, Image, Monitor, BookOpen, CheckSquare, BarChart2, Loader2, Plus, X } from 'lucide-react'

type TipoEvidencia = 'foto' | 'documento' | 'print' | 'relato' | 'decisao' | 'registro'

interface Evidencia {
  id: string
  tipo: TipoEvidencia
  arquivo_url: string | null
  arquivo_nome: string | null
  descricao: string | null
  created_at: string
}

interface Props {
  questionarioId: string
  readOnly?: boolean
}

const TIPOS: { value: TipoEvidencia; label: string; icon: React.ReactNode; aceita: string }[] = [
  { value: 'foto', label: 'Fotos', icon: <Image size={16} />, aceita: 'image/*' },
  { value: 'documento', label: 'Documentos', icon: <FileText size={16} />, aceita: '.pdf,.doc,.docx' },
  { value: 'print', label: 'Prints', icon: <Monitor size={16} />, aceita: 'image/*' },
  { value: 'relato', label: 'Relato', icon: <BookOpen size={16} />, aceita: '' },
  { value: 'decisao', label: 'Decisões', icon: <CheckSquare size={16} />, aceita: 'image/*,.pdf' },
  { value: 'registro', label: 'Registros', icon: <BarChart2 size={16} />, aceita: 'image/*,.pdf' },
]

export default function EvidenciasPanel({ questionarioId, readOnly = false }: Props) {
  const supabase = createClient()
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoEvidencia | null>(null)
  const [descricao, setDescricao] = useState('')
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarEvidencias()
  }, [questionarioId])

  async function carregarEvidencias() {
    setLoading(true)
    const { data } = await supabase
      .from('evidencias')
      .select('*')
      .eq('questionario_id', questionarioId)
      .order('created_at', { ascending: false })
    setEvidencias(data ?? [])
    setLoading(false)
  }

  async function handleUploadArquivo(file: File, tipo: TipoEvidencia) {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${questionarioId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(path, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('evidencias')
        .getPublicUrl(path)

      const res = await fetch('/api/evidencias/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionario_id: questionarioId,
          tipo,
          arquivo_url: publicUrl,
          arquivo_nome: file.name,
          descricao: descricao || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar metadados')

      toast.success('Evidência enviada com sucesso!')
      setDescricao('')
      setShowForm(false)
      setTipoSelecionado(null)
      await carregarEvidencias()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao enviar arquivo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRelato() {
    if (!descricao.trim()) {
      toast.error('Escreva o relato antes de enviar.')
      return
    }
    setUploading(true)
    try {
      const res = await fetch('/api/evidencias/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionario_id: questionarioId,
          tipo: 'relato',
          descricao,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Relato salvo!')
      setDescricao('')
      setShowForm(false)
      setTipoSelecionado(null)
      await carregarEvidencias()
    } catch {
      toast.error('Erro ao salvar relato.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeletar(id: string) {
    if (!confirm('Remover esta evidência?')) return
    const res = await fetch(`/api/evidencias/salvar?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Evidência removida.')
      await carregarEvidencias()
    } else {
      toast.error('Erro ao remover.')
    }
  }

  const tipoInfo = (tipo: TipoEvidencia) => TIPOS.find(t => t.value === tipo)

  return (
    <div style={{
      background: '#1a1713',
      borderTop: '1px solid rgba(212,168,67,0.15)',
      padding: '24px 32px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '4px' }}>
            Prova de Execução
          </p>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', color: '#f5f0e8' }}>
            Evidências
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
              background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)',
              border: 'none',
              color: showForm ? '#7a7060' : '#1a1713',
              fontSize: '12px', fontWeight: '500',
            }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancelar' : 'Adicionar evidência'}
          </button>
        )}
      </div>

      {/* Formulário de upload */}
      {!readOnly && showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          {/* Tipos */}
          <p style={{ fontSize: '11px', color: '#7a7060', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
            Selecione o tipo
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {TIPOS.map(tipo => (
              <button
                key={tipo.value}
                onClick={() => setTipoSelecionado(tipo.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '4px', cursor: 'pointer',
                  border: tipoSelecionado === tipo.value
                    ? '1px solid #d4a843'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: tipoSelecionado === tipo.value
                    ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.02)',
                  color: tipoSelecionado === tipo.value ? '#d4a843' : '#7a7060',
                  fontSize: '12px',
                }}
              >
                {tipo.icon}
                {tipo.label}
              </button>
            ))}
          </div>

          {tipoSelecionado && (
            <>
              {/* Campo de descrição */}
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder={tipoSelecionado === 'relato'
                  ? 'Escreva seu relato aqui...'
                  : 'Adicione uma descrição (opcional)...'}
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px', padding: '10px 12px',
                  color: '#f5f0e8', fontSize: '13px', lineHeight: '1.6',
                  resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                  marginBottom: '12px',
                }}
              />

              {tipoSelecionado === 'relato' ? (
                <button
                  onClick={handleRelato}
                  disabled={uploading || !descricao.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: '4px', cursor: 'pointer',
                    background: uploading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)',
                    border: 'none',
                    color: uploading ? '#7a7060' : '#1a1713',
                    fontSize: '13px', fontWeight: '500',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {uploading && <Loader2 size={14} />}
                  Salvar relato
                </button>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={TIPOS.find(t => t.value === tipoSelecionado)?.aceita}
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file && tipoSelecionado) handleUploadArquivo(file, tipoSelecionado)
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '4px', cursor: 'pointer',
                      background: uploading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #c8a96e 0%, #d4a843 100%)',
                      border: 'none',
                      color: uploading ? '#7a7060' : '#1a1713',
                      fontSize: '13px', fontWeight: '500',
                    }}
                  >
                    {uploading ? <Loader2 size={14} /> : <Upload size={14} />}
                    {uploading ? 'Enviando...' : 'Escolher arquivo'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Lista de evidências */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#7a7060', fontSize: '13px' }}>
          Carregando...
        </div>
      ) : evidencias.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '6px', color: '#7a7060', fontSize: '13px',
        }}>
          {readOnly
            ? 'Nenhuma evidência enviada pelo membro.'
            : 'Sem prova, não existiu. Adicione suas evidências acima.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {evidencias.map(ev => {
            const info = tipoInfo(ev.tipo)
            const isImage = ev.arquivo_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(ev.arquivo_url)

            return (
              <div key={ev.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Preview de imagem */}
                {isImage && (
                  <div
                    style={{
                      width: '100%', height: '120px',
                      background: `url(${ev.arquivo_url}) center/cover no-repeat`,
                      cursor: 'pointer',
                    }}
                    onClick={() => window.open(ev.arquivo_url!, '_blank')}
                  />
                )}

                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: '#c8a96e' }}>{info?.icon}</span>
                    <span style={{ fontSize: '11px', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {info?.label}
                    </span>
                  </div>

                  {ev.descricao && (
                    <p style={{ fontSize: '12px', color: '#7a7060', lineHeight: '1.5', marginBottom: '4px' }}>
                      {ev.descricao.length > 80 ? ev.descricao.slice(0, 80) + '...' : ev.descricao}
                    </p>
                  )}

                  {ev.arquivo_nome && !isImage && (
                    <a
                      href={ev.arquivo_url!}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: '#c8a96e', textDecoration: 'underline' }}
                    >
                      {ev.arquivo_nome}
                    </a>
                  )}
                </div>

                {!readOnly && (
                  <button
                    onClick={() => handleDeletar(ev.id)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      borderRadius: '4px', padding: '4px',
                      cursor: 'pointer', color: '#8b3a2a',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
