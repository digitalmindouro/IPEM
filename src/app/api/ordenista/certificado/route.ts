import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'IPEM-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role, nome').eq('id', user.id).single()
    if (!['mentor', 'guardiao', 'ordenista'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { membro_id, tipo } = await request.json()
    if (!membro_id || !tipo) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

    const { data: membro } = await supabase.from('profiles').select('nome').eq('id', membro_id).single()

    const codigo = gerarCodigo()

    const { data: cert, error } = await supabase
      .from('certificados')
      .insert({
        membro_id,
        tipo,
        codigo_unico: codigo,
        data_emissao: new Date().toISOString(),
        emitido_por: user.id,
        dados: { nome_membro: membro?.nome, nome_emissor: profile?.nome, tipo },
      })
      .select(`
        *,
        membro:profiles!membro_id(id, nome, email),
        emissor:profiles!emitido_por(id, nome, role)
      `)
      .single()

    if (error) throw error

    // Notificar o membro
    await supabase.from('notificacoes').insert({
      destinatario_id: membro_id,
      tipo: 'certificado',
      mensagem: `🏆 Seu certificado foi emitido! Código: ${codigo}`,
      link: '/membro',
    })

    return NextResponse.json({ success: true, certificado: cert })
  } catch (error) {
    console.error('Erro ao emitir certificado:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
