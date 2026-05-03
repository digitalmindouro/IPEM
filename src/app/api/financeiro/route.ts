import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    let query = supabase
      .from('financeiro_parcelas')
      .select(`
        *,
        membro:profiles!membro_id(id, nome, email),
        responsavel:profiles!responsavel_id(id, nome, role),
        financeiro_pagamentos(*)
      `)
      .order('created_at', { ascending: false })

    // Membro vê só as próprias
    if (profile?.role === 'membro') {
      query = query.eq('membro_id', user.id)
    }
    // Mentor/Guardião vê só as dos seus membros
    else if (['facilitador', 'mentor', 'guardiao'].includes(profile?.role)) {
      query = query.eq('responsavel_id', user.id)
    }
    // Ordenista vê tudo

    const { data: parcelas, error } = await query
    if (error) throw error

    return NextResponse.json({ parcelas: parcelas ?? [] })
  } catch (error) {
    console.error('Erro financeiro GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { membro_id, turma_id, valor_total, numero_parcelas, forma_pagamento, observacoes } = body

    if (!membro_id || !valor_total || !numero_parcelas) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const valor_parcela = Number((valor_total / numero_parcelas).toFixed(2))

    const { data: parcela, error } = await supabase
      .from('financeiro_parcelas')
      .insert({
        membro_id,
        responsavel_id: user.id,
        turma_id: turma_id || null,
        valor_total,
        numero_parcelas,
        valor_parcela,
        forma_pagamento: forma_pagamento || 'cartao',
        status: 'pendente',
        observacoes: observacoes || null,
      })
      .select()
      .single()

    if (error) throw error

    // Criar as parcelas individuais
    const pagamentos = Array.from({ length: numero_parcelas }, (_, i) => {
      const vencimento = new Date()
      vencimento.setMonth(vencimento.getMonth() + i)
      return {
        parcela_id: parcela.id,
        numero_parcela: i + 1,
        valor: valor_parcela,
        data_vencimento: vencimento.toISOString().split('T')[0],
        pago: false,
      }
    })

    await supabase.from('financeiro_pagamentos').insert(pagamentos)

    return NextResponse.json({ success: true, parcela })
  } catch (error) {
    console.error('Erro financeiro POST:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { pagamento_id, pago } = body

    if (!pagamento_id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const { data: pagamento, error } = await supabase
      .from('financeiro_pagamentos')
      .update({
        pago,
        data_pagamento: pago ? new Date().toISOString() : null,
        registrado_por: user.id,
      })
      .eq('id', pagamento_id)
      .select('*, parcela:financeiro_parcelas(*)')
      .single()

    if (error) throw error

    // Atualizar status da parcela
    const { data: todosPagamentos } = await supabase
      .from('financeiro_pagamentos')
      .select('pago')
      .eq('parcela_id', pagamento.parcela_id)

    const totalPagas = todosPagamentos?.filter(p => p.pago).length ?? 0
    const total = todosPagamentos?.length ?? 0
    const novoStatus = totalPagas === 0 ? 'pendente' : totalPagas === total ? 'quitado' : 'parcial'

    await supabase
      .from('financeiro_parcelas')
      .update({ status: novoStatus, parcelas_pagas: totalPagas, updated_at: new Date().toISOString() })
      .eq('id', pagamento.parcela_id)

    return NextResponse.json({ success: true, status: novoStatus, parcelas_pagas: totalPagas })
  } catch (error) {
    console.error('Erro financeiro PATCH:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
