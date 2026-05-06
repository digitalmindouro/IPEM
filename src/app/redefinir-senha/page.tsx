'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Flame, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error('Erro ao redefinir senha. O link pode ter expirado.')
    } else {
      toast.success('Senha redefinida com sucesso!')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-subtle-texture opacity-100 pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <Flame className="text-gold" size={28} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl text-paper tracking-wide mb-1">I.P.E.M</h1>
          <p className="text-muted text-sm tracking-widest uppercase">Nova Senha</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nova senha</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar senha</label>
            <input type={showPassword ? 'text' : 'password'} className="input"
              placeholder="••••••••" value={confirm}
              onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" className="btn-gold w-full mt-4" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
