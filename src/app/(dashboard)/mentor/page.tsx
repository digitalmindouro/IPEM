import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MentorDashboard from '@/components/mentor/MentorDashboard'

export default async function MentorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar turmas do mentor com membros e progresso
  const rolesQueVeemTudo = ['guardiao', 'ordenista']
  const turmasQuery = supabase
    .from('turmas')
    .select(`
      *,
      membros_turma(
        id, membro_id, data_entrada, concluiu,
        membro:profiles!membro_id(id, nome, email, role)
      )
    `)
    .order('created_at', { ascending: false })

  const { data: turmas } = rolesQueVeemTudo.includes(profile?.role)
    ? await turmasQuery
    : await turmasQuery.eq('responsavel_id', user.id)

  // Buscar todos os questionários dos membros dessas turmas
  const membroIds = turmas?.flatMap(t => t.membros_turma?.map((m: any) => m.membro_id) ?? []) ?? []
  
  const { data: questionarios } = membroIds.length > 0
    ? await supabase
        .from('questionarios')
        .select('membro_id, numero_caderno, status')
        .in('membro_id', membroIds)
    : { data: [] }

  // Buscar todos os profiles para adicionar membros
  const { data: todosProfiles } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .eq('role', 'membro')
    .order('nome')

  return (
    <MentorDashboard
      profile={profile}
      turmas={turmas ?? []}
      questionarios={questionarios ?? []}
      todosProfiles={todosProfiles ?? []}
    />
  )
}
