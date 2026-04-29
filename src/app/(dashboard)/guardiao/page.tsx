import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GuardiaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl">
      <p className="text-muted text-xs uppercase tracking-widest mb-2">Guardião</p>
      <h1 className="font-display text-4xl text-paper mb-4">Painel do Guardião</h1>
      <p className="text-muted text-sm">Em construção. Em breve você poderá gerenciar mentores e turmas aqui.</p>
    </div>
  )
}
