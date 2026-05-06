'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'
import { Flame, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [esqueceu, setEsqueceu]       = useState(false)
  const [emailReset, setEmailReset]   = useState('')
  const [loadingReset, setLoadingReset] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const role = (profile?.role as Role) ?? 'membro'
      router.push(`/${role}`)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoadingReset(true)
    const { error } = await supabase.auth.resetPasswordForEmail(emailReset, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoadingReset(false)
    if (error) {
      toast.error('Erro ao enviar email. Verifique o endereço.')
    } else {
      toast.success('Email enviado! Verifique sua caixa de entrada.')
      setEsqueceu(false)
      setEmailReset('')
    }
  }

  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-subtle-texture opacity-100 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Flame className="text-gold" size={28} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl text-paper tracking-wide mb-1">I.P.E.M</h1>
          <p className="text-muted text-sm tracking-widest uppercase">Ordenismo</p>
        </div>

        {!esqueceu ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" className="input" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="label">Senha</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setEsqueceu(true)}
                className="text-xs text-muted hover:text-gold transition-colors">
                Esqueci minha senha
              </button>
            </div>
            <button type="submit" className="btn-gold w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-paper text-sm">Digite seu email para receber o link de redefinição.</p>
            </div>
            <div>
              <label htmlFor="emailReset" className="label">Email</label>
              <input id="emailReset" type="email" className="input" placeholder="seu@email.com"
                value={emailReset} onChange={e => setEmailReset(e.target.value)} required autoComplete="email" />
            </div>
            <button type="submit" className="btn-gold w-full" disabled={loadingReset}>
              {loadingReset ? 'Enviando...' : 'Enviar link'}
            </button>
            <button type="button" onClick={() => setEsqueceu(false)}
              className="w-full text-center text-xs text-muted hover:text-gold transition-colors mt-2">
              Voltar ao login
            </button>
          </form>
        )}

        <div className="divider-gold" />
        <p className="text-center text-muted text-xs italic tracking-wide">
          "Antes de mudar o mundo, eu me organizei."
        </p>
      </div>
    </div>
  )
}
