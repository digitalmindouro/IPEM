import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { turma_id, membro_id } = body

    if (!turma_id || !membro_id) {
      return NextResponse.json({ error: 'turma_id e membro_id obrigatórios' }, { status: 400 })
    }

    // Verificar se já está na turma
    const { data: existing } = await supabase
      .from('membros_turma')
      .select('id')
      .eq('turma_id', turma_id)
      .eq('membro_id', membro_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Membro já está nesta turma' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('membros_turma')
      .insert({
        turma_id,
        membro_id,
        data_entrada: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Notificar o membro
    await supabase.from('notificacoes').insert({
      destinatario_id: membro_id,
      tipo: 'turma_entrada',
      mensagem: 'Você foi adicionado a uma turma.',
      link: '/membro',
    })

    return NextResponse.json({ success: true, membro_turma: data })
  } catch (error) {
    console.error('Erro ao adicionar membro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const turma_id = searchParams.get('turma_id')
    const membro_id = searchParams.get('membro_id')

    if (!turma_id || !membro_id) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios' }, { status: 400 })
    }

    await supabase
      .from('membros_turma')
      .delete()
      .eq('turma_id', turma_id)
      .eq('membro_id', membro_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover membro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
