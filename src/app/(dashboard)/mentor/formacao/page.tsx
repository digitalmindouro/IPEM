import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CADERNO_LETRA = ['I', 'P', 'E', 'M']

function ProgressoCadernos({ aprovados }: { aprovados: number }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4].map(num => {
        const ok = num <= aprovados
        return (
          <div key={num} style={{
            width: '24px', height: '24px', borderRadius: '4px',
            background: ok ? 'rgba(212,168,67,0.2)' : 'rgba(255,255,255,0.05)',
            color: ok ? '#d4a843' : '#7a7060',
            fontSize: '10px', fontWeight: '600',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Playfair Display, serif',
          }}>
            {ok ? '✓' : CADERNO_LETRA[num-1]}
          </div>
        )
      })}
    </div>
  )
}

function CriterioCard({ label, desc, ok }: { label: string; desc: string; ok?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', borderRadius: '6px', background: ok ? 'rgba(212,168,67,0.05)' : 'transparent', border: ok ? '1px solid rgba(212,168,67,0.2)' : '1px solid transparent' }}>
      <p style={{ color: ok ? '#d4a843' : '#f5f0e8', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
        {ok ? '✓ ' : ''}{label}
      </p>
      <p style={{ color: '#7a7060', fontSize: '11px' }}>{desc}</p>
    </div>
  )
}

function GrupoFormacao({ titulo, cor, pessoas, questionarios, aprovacoes, roleBadge }: any) {
  if (pessoas.length === 0) return null
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: cor, marginBottom: '12px' }}>
        {titulo} ({pessoas.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pessoas.map((p: any) => {
          const qs = questionarios?.filter((q: any) => q.membro_id === p.id) ?? []
          const aprovadosCadernos = qs.filter((q: any) => q.status === 'aprovado').length
          const validacoes = aprovacoes?.filter((a: any) => a.validador_id === p.id && a.decisao === 'aprovado').length ?? 0

          return (
            <div key={p.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cor, fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
                {p.nome.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <p style={{ color: '#f5f0e8', fontSize: '13px', fontWeight: '500' }}>{p.nome}</p>
                  <span style={{ fontSize: '10px', color: cor, background: `${cor}15`, padding: '1px 6px', borderRadius: '100px' }}>{roleBadge}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ProgressoCadernos aprovados={aprovadosCadernos} />
                  {p.role === 'facilitador' && (
                    <span style={{ fontSize: '11px', color: validacoes >= 3 ? '#d4a843' : '#7a7060' }}>
                      {validacoes}/3 membros validados
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function FormacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Buscar pessoas por role
  const { data: membros } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'membro').order('nome')
  const { data: facilitadores } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'facilitador').order('nome')
  const { data: mentores } = await supabase.from('profiles').select('id, nome, email, role').eq('role', 'mentor').order('nome')

  // Buscar questionários e aprovações
  const todosIds = [
    ...(membros?.map(p => p.id) ?? []),
    ...(facilitadores?.map(p => p.id) ?? []),
    ...(mentores?.map(p => p.id) ?? []),
  ]

  const { data: questionarios } = todosIds.length > 0
    ? await supabase.from('questionarios').select('membro_id, numero_caderno, status').in('membro_id', todosIds)
    : { data: [] }

  const { data: aprovacoes } = todosIds.length > 0
    ? await supabase.from('aprovacoes').select('validador_id, decisao').in('validador_id', todosIds)
    : { data: [] }

  // Dados do próprio usuário para ver seu progresso
  const meuQs = questionarios?.filter(q => q.membro_id === user.id) ?? []
  const meusAprovados = meuQs.filter(q => q.status === 'aprovado').length
  const minhasValidacoes = aprovacoes?.filter(a => a.validador_id === user.id && a.decisao === 'aprovado').length ?? 0

  return (
    <div className="max-w-4xl">
      <div style={{ marginBottom: '28px' }}>
        <p className="text-muted text-xs uppercase tracking-widest mb-2">
          {role === 'guardiao' ? 'Guardião' : role === 'mentor' ? 'Mentor' : role === 'ordenista' ? 'Ordenista' : 'Membro'}
        </p>
        <h1 className="font-display text-4xl text-paper mb-2">Formação</h1>
        <p className="text-muted text-sm">Trilha de crescimento no Ordenismo.</p>
      </div>

      {/* SEU PROGRESSO — para membro, facilitador, mentor */}
      {['membro', 'facilitador', 'mentor'].includes(role) && (
        <div className="card-gold" style={{ marginBottom: '28px', padding: '24px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '16px' }}>
            Seu Progresso
          </p>

          {/* Membro → Facilitador */}
          {role === 'membro' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Facilitador</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <CriterioCard label="4 cadernos aprovados" desc={`${meusAprovados}/4 concluídos`} ok={meusAprovados === 4} />
                <CriterioCard label="Aprovação do Mentor" desc="Validação manual" />
              </div>
            </div>
          )}

          {/* Facilitador → Mentor */}
          {role === 'facilitador' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Mentor</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <CriterioCard label="4 cadernos aprovados" desc={`${meusAprovados}/4`} ok={meusAprovados === 4} />
                <CriterioCard label="3 membros validados" desc={`${minhasValidacoes}/3`} ok={minhasValidacoes >= 3} />
                <CriterioCard label="Formação R$5.000" desc="Investimento confirmado" />
              </div>
            </div>
          )}

          {/* Mentor → Guardião */}
          {role === 'mentor' && (
            <div>
              <p style={{ color: '#f5f0e8', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Próximo: Guardião</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <CriterioCard label="Histórico comprovado" desc="Como mentor" ok={true} />
                <CriterioCard label="Mentores formados" desc="Mínimo 1" ok={(mentores?.length ?? 0) > 0} />
                <CriterioCard label="Formação R$10.000" desc="Investimento confirmado" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISÃO GERAL — para mentor, guardião, ordenista */}
      {['mentor', 'guardiao', 'ordenista'].includes(role) && (
        <div>
          <GrupoFormacao
            titulo="Membros"
            cor="#7a7060"
            pessoas={membros ?? []}
            questionarios={questionarios}
            aprovacoes={aprovacoes}
            roleBadge="Membro"
          />
          <GrupoFormacao
            titulo="Facilitadores em Formação"
            cor="#c8a96e"
            pessoas={facilitadores ?? []}
            questionarios={questionarios}
            aprovacoes={aprovacoes}
            roleBadge="Facilitador"
          />
          {['guardiao', 'ordenista'].includes(role) && (
            <GrupoFormacao
              titulo="Mentores em Formação"
              cor="#d4a843"
              pessoas={mentores ?? []}
              questionarios={questionarios}
              aprovacoes={aprovacoes}
              roleBadge="Mentor"
            />
          )}
        </div>
      )}

      {/* MEMBRO — só vê sua trilha */}
      {role === 'membro' && meusAprovados < 4 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p style={{ color: '#7a7060', fontSize: '13px' }}>
            Complete os 4 cadernos para avançar na trilha de formação.
          </p>
        </div>
      )}
    </div>
  )
}
