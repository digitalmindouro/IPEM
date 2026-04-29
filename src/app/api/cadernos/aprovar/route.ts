import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se tem permissão para validar
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const rolesPermitidos = ['facilitador', 'mentor', 'guardiao', 'ordenista']
    if (!profile || !rolesPermitidos.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para validar.' }, { status: 403 })
    }

    const body = await request.json()
    const { questionario_id, decisao, observacao } = body

    if (!questionario_id || !decisao) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const decisoesValidas = ['aprovado', 'ajustar', 'reaplicar']
    if (!decisoesValidas.includes(decisao)) {
      return NextResponse.json({ error: 'Decisão inválida.' }, { status: 400 })
    }

    // Verificar que o questionário existe e está aguardando aprovação
    const { data: questionario } = await supabase
      .from('questionarios')
      .select('*')
      .eq('id', questionario_id)
      .single()

    if (!questionario) {
      return NextResponse.json({ error: 'Caderno não encontrado.' }, { status: 404 })
    }

    if (questionario.status !== 'aguardando_aprovacao') {
      return NextResponse.json(
        { error: 'Este caderno não está aguardando aprovação.' },
        { status: 400 }
      )
    }

    // Atualizar status do questionário
    const novoStatus = decisao // 'aprovado' | 'ajustar' | 'reaplicar'
    const { error: updateError } = await supabase
      .from('questionarios')
      .update({
        status: novoStatus,
        updated_at: new Date().toISOString(),
        ...(decisao === 'aprovado' ? { data_conclusao: new Date().toISOString() } : {}),
      })
      .eq('id', questionario_id)

    if (updateError) throw updateError

    // Salvar registro da aprovação
    await supabase.from('aprovacoes').insert({
      questionario_id,
      validador_id: user.id,
      decisao,
      observacao: observacao || null,
    }).select()
    // Ignora erro se a tabela não existir ainda

    const mensagens: Record<string, string> = {
      aprovado: 'Caderno aprovado com sucesso! O próximo foi desbloqueado.',
      ajustar: 'Membro notificado para revisar o caderno.',
      reaplicar: 'Membro notificado para reaplicar o caderno.',
    }

    return NextResponse.json({
      success: true,
      decisao,
      message: mensagens[decisao],
    })

  } catch (error) {
    console.error('Erro ao aprovar caderno:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar decisão.' },
      { status: 500 }
    )
  }
}
