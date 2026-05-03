import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FinanceiroPanel from '@/components/financeiro/FinanceiroPanel'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar todos os membros para o form de novo lançamento
  const { data: todosProfiles } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .order('nome')

  // Buscar turmas do responsável
  const { data: turmas } = await supabase
    .from('turmas')
    .select('id, nome')
    .order('nome')

  return (
    <div className="max-w-4xl">
      <FinanceiroPanel
        userRole={profile?.role ?? 'membro'}
        userId={user.id}
        todosProfiles={todosProfiles ?? []}
        turmas={turmas ?? []}
      />
    </div>
  )
}
