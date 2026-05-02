import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: notificacoes } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('destinatario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ notificacoes: notificacoes ?? [] })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { id } = body

    if (id) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', id).eq('destinatario_id', user.id)
    } else {
      await supabase.from('notificacoes').update({ lida: true }).eq('destinatario_id', user.id).eq('lida', false)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
