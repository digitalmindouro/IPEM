import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CadernoViewer from '@/components/cadernos/CadernoViewer'
import type { CadernoNumero, StatusCaderno } from '@/types'

interface Props {
  params: { numero: string }
}

export default async function CadernoPage({ params }: Props) {
  const numero = Number(params.numero)
  if (![1, 2, 3, 4].includes(numero)) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (numero > 1) {
    const { data: anterior } = await supabase
      .from('questionarios')
      .select('status')
      .eq('membro_id', user.id)
      .eq('numero_caderno', numero - 1)
      .single()
    if (anterior?.status !== 'aprovado') redirect('/membro')
  }

  // Buscar questionário existente
  let { data: questionario } = await supabase
    .from('questionarios')
    .select('*')
    .eq('membro_id', user.id)
    .eq('numero_caderno', numero)
    .single()

  // Criar automaticamente se não existir
  if (!questionario) {
    const { data: novo } = await supabase
      .from('questionarios')
      .insert({
        membro_id: user.id,
        numero_caderno: numero,
        respostas: {},
        status: 'em_andamento',
        turma_id: null,
      })
      .select('*')
      .single()
    questionario = novo
  }

  const respostasIniciais = (questionario?.respostas as Record<string, string | number>) ?? {}
  const status = (questionario?.status as StatusCaderno) ?? 'em_andamento'

  return (
    <CadernoViewer
      numero={numero as CadernoNumero}
      questionarioId={questionario?.id ?? null}
      respostasIniciais={respostasIniciais}
      status={status}
    />
  )
}
