import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const rolesPermitidos = ['mentor', 'guardiao', 'ordenista']
    if (!profile || !rolesPermitidos.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar turmas' }, { status: 403 })
    }

    const body = await request.json()
    const { nome, data_inicio, data_fim, max_membros, observacoes } = body

    if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

    const { data: turma, error } = await supabase
      .from('turmas')
      .insert({
        nome,
        responsavel_id: user.id,
        status: 'ativa',
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        max_membros: max_membros || null,
        observacoes: observacoes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, turma })
  } catch (error) {
    console.error('Erro ao criar turma:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('turmas')
      .select(`
        *,
        responsavel:profiles!responsavel_id(id, nome, role),
        membros_turma(
          id, membro_id, data_entrada, concluiu,
          membro:profiles!membro_id(id, nome, email)
        )
      `)
      .order('created_at', { ascending: false })

    // Ordenista vê todas, outros veem só as suas
    if (profile?.role !== 'ordenista' && profile?.role !== 'guardiao') {
      query = query.eq('responsavel_id', user.id)
    }

    const { data: turmas, error } = await query
    if (error) throw error

    return NextResponse.json({ turmas })
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
