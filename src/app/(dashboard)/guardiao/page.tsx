import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function GuardiaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar todos os mentores
  const { data: mentores } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .eq('role', 'mentor')
    .order('nome')

  // Buscar todas as turmas com membros e progresso
  const { data: turmas } = await supabase
    .from('turmas')
    .select(`
      *,
      responsavel:profiles!responsavel_id(id, nome, role),
      membros_turma(
        id, membro_id,
        membro:profiles!membro_id(id, nome, email)
      )
    `)
    .order('created_at', { ascending: false })

  // Buscar questionários para ver progresso
  const membroIds = turmas?.flatMap(t => t.membros_turma?.map((m: any) => m.membro_id) ?? []) ?? []
  const { data: questionarios } = membroIds.length > 0
    ? await supabase
        .from('questionarios')
        .select('membro_id, numero_caderno, status')
        .in('membro_id', membroIds)
    : { data: [] }

  // Agrupar turmas por mentor
  const turmasPorMentor = mentores?.map(mentor => ({
    mentor,
    turmas: turmas?.filter(t => t.responsavel_id === mentor.id) ?? [],
  })) ?? []

  // Turmas sem mentor definido (criadas por guardião/ordenista)
  const mentorIds = mentores?.map(m => m.id) ?? []
  const turmasSemMentor = turmas?.filter(t => !mentorIds.includes(t.responsavel_id)) ?? []

  return (
    <div className="max-w-4xl">
      <div style={{ marginBottom: '32px' }}>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">Guardião</p>
        <h1 className="font-display text-4xl text-paper mb-2">Painel do Guardião</h1>
        <p className="text-muted text-sm">
          {mentores?.length ?? 0} mentores · {turmas?.length ?? 0} turmas · {membroIds.length} membros
        </p>
      </div>

      {/* Resumo geral */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Mentores ativos', valor: mentores?.length ?? 0, cor: '#d4a843' },
          { label: 'Turmas ativas', valor: turmas?.filter(t => t.status === 'ativa').length ?? 0, cor: '#c8a96e' },
          { label: 'Membros no sistema', valor: membroIds.length, cor: '#7a7060' },
        ].map(item => (
          <div key={item.label} className="card-gold" style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: item.cor, marginBottom: '4px' }}>{item.valor}</p>
            <p style={{ fontSize: '11px', color: '#7a7060', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Mentores e suas turmas */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '16px' }}>
          Mentores
        </p>

        {mentores?.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: '#7a7060', fontSize: '13px' }}>Nenhum mentor no sistema ainda.</p>
          </div>
        ) : turmasPorMentor.map(({ mentor, turmas: turmasMentor }) => (
          <div key={mentor.id} className="card-gold" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: turmasMentor.length > 0 ? '16px' : '0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
                {mentor.nome.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{mentor.nome}</p>
                <p style={{ color: '#7a7060', fontSize: '12px' }}>{turmasMentor.length} {turmasMentor.length === 1 ? 'turma' : 'turmas'}</p>
              </div>
            </div>

            {turmasMentor.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '52px' }}>
                {turmasMentor.map(turma => {
                  const membrosCount = turma.membros_turma?.length ?? 0
                  const aprovados = turma.membros_turma?.filter((mt: any) =>
                    questionarios?.filter(q => q.membro_id === mt.membro_id && q.status === 'aprovado').length === 4
                  ).length ?? 0

                  return (
                    <div key={turma.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ color: '#f5f0e8', fontSize: '13px' }}>{turma.nome}</p>
                        <span style={{ fontSize: '11px', color: turma.status === 'ativa' ? '#d4a843' : '#7a7060', background: turma.status === 'ativa' ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '100px' }}>
                          {turma.status}
                        </span>
                      </div>
                      <p style={{ color: '#7a7060', fontSize: '12px', marginTop: '4px' }}>
                        {membrosCount} membros · {aprovados} concluídos
                        {turma.data_inicio && ` · ${new Date(turma.data_inicio).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Turmas sem mentor */}
      {turmasSemMentor.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '16px' }}>
            Outras Turmas
          </p>
          {turmasSemMentor.map(turma => (
            <div key={turma.id} className="card" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{turma.nome}</p>
                  <p style={{ color: '#7a7060', fontSize: '12px', marginTop: '2px' }}>
                    Responsável: {turma.responsavel?.nome ?? 'Desconhecido'} · {turma.membros_turma?.length ?? 0} membros
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: '#7a7060' }}>{turma.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
