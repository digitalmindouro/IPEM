import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormacaoClient from '@/components/formacao/FormacaoClient'

export const dynamic = 'force-dynamic'

export default async function FormacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  const { data: membros } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'membro').order('nome')
  const { data: facilitadores } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'facilitador').order('nome')
  const { data: mentores } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'mentor').order('nome')

  const todosIds = [
    ...(membros?.map(p => p.id) ?? []),
    ...(facilitadores?.map(p => p.id) ?? []),
    ...(mentores?.map(p => p.id) ?? []),
  ]

  const { data: questionarios } = todosIds.length > 0
    ? await supabase.from('questionarios').select('membro_id, numero_caderno, status').in('membro_id', todosIds)
    : { data: [] }

  const { data: aprovacoes } = todosIds.length > 0
    ? await supabase.from('aprovacoes').select('validador_id, decisao').in('validador_id', todosIds)
    : { data: [] }

  const meuQs = questionarios?.filter(q => q.membro_id === user.id) ?? []
  const meusAprovados = meuQs.filter(q => q.status === 'aprovado').length
  const minhasValidacoes = aprovacoes?.filter(a => a.validador_id === user.id && a.decisao === 'aprovado').length ?? 0

  return (
    <FormacaoClient
      role={role}
      userId={user.id}
      membros={membros ?? []}
      facilitadores={facilitadores ?? []}
      mentores={mentores ?? []}
      questionarios={questionarios ?? []}
      aprovacoes={aprovacoes ?? []}
      meusAprovados={meusAprovados}
      minhasValidacoes={minhasValidacoes}
    />
  )
}
