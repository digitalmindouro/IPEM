import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OrdenistaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl">
      <p className="text-muted text-xs uppercase tracking-widest mb-2">Ordenista</p>
      <h1 className="font-display text-4xl text-paper mb-4">Painel do Ordenista</h1>
      <p className="text-muted">Em construção. O sistema está funcionando! ✅</p>
    </div>
  )
}
