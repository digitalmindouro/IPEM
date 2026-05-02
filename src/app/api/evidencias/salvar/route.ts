import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { questionario_id, tipo, arquivo_url, arquivo_nome, descricao } = body

    if (!questionario_id || !tipo) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('evidencias')
      .insert({
        questionario_id,
        membro_id: user.id,
        tipo,
        arquivo_url: arquivo_url || null,
        arquivo_nome: arquivo_nome || null,
        descricao: descricao || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, evidencia: data })
  } catch (error) {
    console.error('Erro ao salvar evidência:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

    const { data: ev } = await supabase
      .from('evidencias')
      .select('arquivo_url, membro_id')
      .eq('id', id)
      .single()

    if (!ev || ev.membro_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    // Remover arquivo do storage se existir
    if (ev.arquivo_url) {
      const path = ev.arquivo_url.split('/evidencias/')[1]
      if (path) await supabase.storage.from('evidencias').remove([path])
    }

    await supabase.from('evidencias').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evidência:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
