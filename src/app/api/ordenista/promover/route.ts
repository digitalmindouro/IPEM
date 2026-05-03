import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['guardiao', 'ordenista'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { membro_id, nova_role } = await request.json()
    if (!membro_id || !nova_role) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

    const rolesValidas = ['facilitador', 'mentor', 'guardiao', 'ordenista']
    if (!rolesValidas.includes(nova_role)) return NextResponse.json({ error: 'Role inválida' }, { status: 400 })

    const { error } = await supabase.from('profiles').update({ role: nova_role }).eq('id', membro_id)
    if (error) throw error

    // Notificar o membro
    const labels: Record<string, string> = {
      facilitador: 'Facilitador', mentor: 'Mentor', guardiao: 'Guardião', ordenista: 'Ordenista'
    }
    await supabase.from('notificacoes').insert({
      destinatario_id: membro_id,
      tipo: 'promocao',
      mensagem: `🎉 Parabéns! Você foi promovido para ${labels[nova_role]}.`,
      link: `/${nova_role}`,
    })

    return NextResponse.json({ success: true, nova_role })
  } catch (error) {
    console.error('Erro ao promover:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
