import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { numero_caderno, respostas, status: statusParam, acao } = body

    if (!numero_caderno || !respostas) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se já existe um questionário para esse caderno
    const { data: existente } = await supabase
      .from('questionarios')
      .select('id, status')
      .eq('membro_id', user.id)
      .eq('numero_caderno', numero_caderno)
      .single()

    // Não permitir edição se já foi aprovado
    if (existente?.status === 'aprovado') {
      return NextResponse.json(
        { error: 'Caderno já aprovado. Não pode ser editado.' },
        { status: 403 }
      )
    }

    const novoStatus = statusParam ?? (acao === 'enviar' ? 'aguardando_aprovacao' : 'em_andamento')

    let questionarioId: string

    if (existente) {
      // Atualizar existente
      const { error } = await supabase
        .from('questionarios')
        .update({
          respostas,
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id)

      if (error) throw error
      questionarioId = existente.id
    } else {
      // Criar novo
      const { data: novo, error } = await supabase
        .from('questionarios')
        .insert({
          membro_id: user.id,
          numero_caderno,
          respostas,
          status: novoStatus,
          turma_id: null,
        })
        .select('id')
        .single()

      if (error) throw error
      questionarioId = novo.id
    }

    return NextResponse.json({
      success: true,
      status: novoStatus,
      questionario: { id: questionarioId },
      message: novoStatus === 'aguardando_aprovacao'
        ? 'Caderno enviado para aprovação!'
        : 'Progresso salvo com sucesso.',
    })

  } catch (error) {
    console.error('Erro ao salvar caderno:', error)
    return NextResponse.json(
      { error: 'Erro interno ao salvar.' },
      { status: 500 }
    )
  }
}
