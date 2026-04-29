import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DecisaoViewer from '@/components/cadernos/DecisaoViewer'
import type { CadernoNumero } from '@/types'

interface Props {
  params: { id: string }
}

export default async function AprovacaoPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar permissão
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const rolesPermitidos = ['facilitador', 'mentor', 'guardiao', 'ordenista']
  if (!profile || !rolesPermitidos.includes(profile.role)) {
    redirect('/membro')
  }

  // Buscar questionário com dados do membro
  const { data: questionario } = await supabase
    .from('questionarios')
    .select('*, profiles:membro_id(nome, email)')
    .eq('id', params.id)
    .single()

  if (!questionario) notFound()

  // Só pode avaliar se estiver aguardando
  if (questionario.status !== 'aguardando_aprovacao') {
    redirect('/facilitador/aprovacoes')
  }

  const membro = questionario.profiles as { nome: string; email: string } | null
  const respostas = (questionario.respostas as Record<string, string | number>) ?? {}

  return (
    <DecisaoViewer
      questionarioId={questionario.id}
      numero={questionario.numero_caderno as CadernoNumero}
      membroNome={membro?.nome ?? 'Membro'}
      respostas={respostas}
    />
  )
}
