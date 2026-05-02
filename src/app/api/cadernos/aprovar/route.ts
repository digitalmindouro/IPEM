import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

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

    const novoStatus = decisao
    const { error: updateError } = await supabase
      .from('questionarios')
      .update({
        status: novoStatus,
        updated_at: new Date().toISOString(),
        ...(decisao === 'aprovado' ? { data_conclusao: new Date().toISOString() } : {}),
      })
      .eq('id', questionario_id)

    if (updateError) throw updateError

    await supabase.from('aprovacoes').insert({
      questionario_id,
      validador_id: user.id,
      decisao,
      observacao: observacao || null,
    })

    // Disparar notificação para o membro
    const mensagensNotif: Record<string, string> = {
      aprovado: `✅ Seu Caderno ${questionario.numero_caderno} foi aprovado! O próximo foi desbloqueado.`,
      ajustar: `⚠️ Seu Caderno ${questionario.numero_caderno} precisa de ajustes. Veja a observação do facilitador.`,
      reaplicar: `🔄 Seu Caderno ${questionario.numero_caderno} precisa ser reaplicado. Veja a observação do facilitador.`,
    }

    await supabase.from('notificacoes').insert({
      destinatario_id: questionario.membro_id,
      tipo: `caderno_${decisao}`,
      mensagem: mensagensNotif[decisao],
      link: `/membro/cadernos/${questionario.numero_caderno}`,
    })

    // Notificar o mentor da turma se houver
    if (questionario.turma_id) {
      const { data: turma } = await supabase
        .from('turmas')
        .select('responsavel_id, nome')
        .eq('id', questionario.turma_id)
        .single()

      if (turma && turma.responsavel_id !== user.id) {
        const { data: membroProfile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', questionario.membro_id)
          .single()

        await supabase.from('notificacoes').insert({
          destinatario_id: turma.responsavel_id,
          tipo: `mentor_caderno_${decisao}`,
          mensagem: `${membroProfile?.nome ?? 'Membro'} teve o Caderno ${questionario.numero_caderno} ${decisao === 'aprovado' ? 'aprovado' : decisao === 'ajustar' ? 'para ajuste' : 'para reaplicar'}.`,
          link: `/mentor`,
        })
      }
    }

    const mensagens: Record<string, string> = {
      aprovado: 'Caderno aprovado com sucesso!',
      ajustar: 'Membro notificado para revisar o caderno.',
      reaplicar: 'Membro notificado para reaplicar o caderno.',
    }

    return NextResponse.json({ success: true, decisao, message: mensagens[decisao] })
  } catch (error) {
    console.error('Erro ao aprovar caderno:', error)
    return NextResponse.json({ error: 'Erro interno ao processar decisão.' }, { status: 500 })
  }
}
