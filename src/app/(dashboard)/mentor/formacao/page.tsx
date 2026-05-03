import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function FormacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar facilitadores em formação (role = facilitador)
  // que estão em turmas onde este mentor é responsável
  const { data: turmas } = await supabase
    .from('turmas')
    .select(`
      id, nome,
      membros_turma(
        membro_id,
        membro:profiles!membro_id(id, nome, email, role)
      )
    `)
    .eq('responsavel_id', user.id)

  // Coletar todos os facilitadores das turmas
  const facilitadores: { id: string; nome: string; email: string; turma: string }[] = []
  turmas?.forEach(turma => {
    turma.membros_turma?.forEach((mt: any) => {
      if (mt.membro?.role === 'facilitador') {
        facilitadores.push({ ...mt.membro, turma: turma.nome })
      }
    })
  })

  // Buscar questionários dos facilitadores para ver progresso como membro
  const facilitadorIds = facilitadores.map(f => f.id)
  const { data: questionarios } = facilitadorIds.length > 0
    ? await supabase
        .from('questionarios')
        .select('membro_id, numero_caderno, status')
        .in('membro_id', facilitadorIds)
    : { data: [] }

  // Buscar aprovações feitas por cada facilitador
  const { data: aprovacoes } = facilitadorIds.length > 0
    ? await supabase
        .from('aprovacoes')
        .select('validador_id, decisao, created_at')
        .in('validador_id', facilitadorIds)
    : { data: [] }

  const CADERNO_LETRA = ['I', 'P', 'E', 'M']

  return (
    <div className="max-w-4xl">
      <div style={{ marginBottom: '32px' }}>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">
          {profile?.role === 'guardiao' ? 'Guardião' : 'Mentor'}
        </p>
        <h1 className="font-display text-4xl text-paper mb-2">Formação</h1>
        <p className="text-muted text-sm">
          Acompanhe o desenvolvimento dos facilitadores em formação.
        </p>
      </div>

      {/* Critérios de formação */}
      <div className="card-gold" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '12px' }}>
          Critérios para Mentor
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: '4 cadernos aprovados', desc: 'Como membro' },
            { label: '3 membros validados', desc: 'Como facilitador' },
            { label: 'Formação R$5.000', desc: 'Investimento confirmado' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{item.label}</p>
              <p style={{ color: '#7a7060', fontSize: '11px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de facilitadores em formação */}
      <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '16px' }}>
        Facilitadores em Formação ({facilitadores.length})
      </p>

      {facilitadores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#7a7060', fontSize: '14px', marginBottom: '8px' }}>
            Nenhum facilitador em formação nas suas turmas.
          </p>
          <p style={{ color: '#7a7060', fontSize: '12px' }}>
            Membros promovidos a Facilitador aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {facilitadores.map(f => {
            const qsFacilitador = questionarios?.filter(q => q.membro_id === f.id) ?? []
            const aprovadosCadernos = qsFacilitador.filter(q => q.status === 'aprovado').length
            const aprovacoesFacilitador = aprovacoes?.filter(a => a.validador_id === f.id) ?? []
            const membrosValidados = aprovacoesFacilitador.filter(a => a.decisao === 'aprovado').length
            const prontoParaMentor = aprovadosCadernos === 4 && membrosValidados >= 3

            return (
              <div key={f.id} className="card-gold">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(212,168,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a843', fontSize: '16px', fontWeight: '600', flexShrink: 0 }}>
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500' }}>{f.nome}</p>
                      {prontoParaMentor && (
                        <span style={{ fontSize: '10px', color: '#d4a843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', padding: '2px 8px', borderRadius: '100px' }}>
                          Pronto para Mentor
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#7a7060', fontSize: '12px', marginBottom: '16px' }}>
                      {f.turma} · {f.email}
                    </p>

                    {/* Progresso cadernos como membro */}
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '10px', color: '#7a7060', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Cadernos como Membro
                      </p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4].map(num => {
                          const q = qsFacilitador.find(q => q.numero_caderno === num)
                          const status = q?.status
                          let bg = 'rgba(255,255,255,0.05)'
                          let color = '#7a7060'
                          let icon = CADERNO_LETRA[num-1]
                          if (status === 'aprovado') { bg = 'rgba(212,168,67,0.2)'; color = '#d4a843'; icon = '✓' }
                          else if (status === 'aguardando_aprovacao') { bg = 'rgba(200,169,110,0.15)'; color = '#c8a96e'; icon = '…' }
                          else if (status === 'em_andamento') { bg = 'rgba(255,255,255,0.08)'; color = '#f5f0e8' }
                          return (
                            <div key={num} style={{ width: '32px', height: '32px', borderRadius: '4px', background: bg, color, fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display, serif' }}>
                              {icon}
                            </div>
                          )
                        })}
                        <span style={{ fontSize: '12px', color: '#7a7060', alignSelf: 'center', marginLeft: '4px' }}>
                          {aprovadosCadernos}/4 aprovados
                        </span>
                      </div>
                    </div>

                    {/* Membros validados como facilitador */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min((membrosValidados / 3) * 100, 100)}%`, background: membrosValidados >= 3 ? 'linear-gradient(90deg, #c8a96e, #d4a843)' : '#7a7060', borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ fontSize: '12px', color: membrosValidados >= 3 ? '#d4a843' : '#7a7060', flexShrink: 0 }}>
                        {membrosValidados}/3 membros validados
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
