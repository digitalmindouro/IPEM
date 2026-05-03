import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrdenistaDashboard from '@/components/ordenista/OrdenistaDashboard'

export const dynamic = 'force-dynamic'

export default async function OrdenistaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Todos os perfis por role
  const { data: todosProfiles } = await supabase
    .from('profiles')
    .select('id, nome, email, role, created_at')
    .order('created_at', { ascending: false })

  // Todas as turmas
  const { data: turmas } = await supabase
    .from('turmas')
    .select(`
      *,
      responsavel:profiles!responsavel_id(id, nome, role),
      membros_turma(id, membro_id)
    `)
    .order('created_at', { ascending: false })

  // Todos os questionários para progresso
  const { data: questionarios } = await supabase
    .from('questionarios')
    .select('membro_id, numero_caderno, status')

  // Certificados emitidos
  const { data: certificados } = await supabase
    .from('certificados')
    .select(`
      *,
      membro:profiles!membro_id(id, nome, email),
      emissor:profiles!emitido_por(id, nome, role)
    `)
    .order('created_at', { ascending: false })

  const membros = todosProfiles?.filter(p => p.role === 'membro') ?? []
  const facilitadores = todosProfiles?.filter(p => p.role === 'facilitador') ?? []
  const mentores = todosProfiles?.filter(p => p.role === 'mentor') ?? []
  const guardioes = todosProfiles?.filter(p => p.role === 'guardiao') ?? []

  return (
    <OrdenistaDashboard
      membros={membros}
      facilitadores={facilitadores}
      mentores={mentores}
      guardioes={guardioes}
      turmas={turmas ?? []}
      questionarios={questionarios ?? []}
      certificados={certificados ?? []}
      todosProfiles={todosProfiles ?? []}
    />
  )
}
