import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CADERNO_INFO, ROLE_LABEL, type CadernoNumero } from '@/types'
import { CheckSquare, Clock, ChevronRight, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function FacilitadorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Buscar todos os cadernos aguardando aprovação
  const { data: pendentes } = await supabase
    .from('questionarios')
    .select('*, profiles:membro_id(nome, email, role)')
    .eq('status', 'aguardando_aprovacao')
    .order('updated_at', { ascending: false })

  // Buscar aprovações recentes feitas por este validador
  const { data: recentes } = await supabase
    .from('questionarios')
    .select('*, profiles:membro_id(nome, email)')
    .in('status', ['aprovado', 'ajustar', 'reaplicar'])
    .order('updated_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest mb-2">
          {ROLE_LABEL[profile.role as keyof typeof ROLE_LABEL]}
        </p>
        <h1 className="font-display text-4xl text-paper mb-2">
          Minha Turma
        </h1>
        <p className="text-muted text-sm">
          Acompanhe e avalie os cadernos dos seus membros.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="card-gold">
          <div className="flex items-center gap-3 mb-1">
            <Clock size={16} className="text-warm" strokeWidth={1.5} />
            <p className="text-muted text-xs uppercase tracking-wider">Aguardando avaliação</p>
          </div>
          <p className="font-display text-3xl text-gold">{pendentes?.length ?? 0}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-1">
            <Users size={16} className="text-muted" strokeWidth={1.5} />
            <p className="text-muted text-xs uppercase tracking-wider">Avaliações recentes</p>
          </div>
          <p className="font-display text-3xl text-paper">{recentes?.length ?? 0}</p>
        </div>
      </div>

      {/* Pendentes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-paper">Aguardando avaliação</h2>
          {(pendentes?.length ?? 0) > 0 && (
            <Link
              href="/facilitador/aprovacoes"
              className="text-gold text-xs uppercase tracking-wider hover:text-gold-light transition-colors"
            >
              Ver todos →
            </Link>
          )}
        </div>

        {!pendentes?.length ? (
          <div className="card text-center py-10">
            <CheckSquare size={32} className="text-muted mx-auto mb-3" strokeWidth={1} />
            <p className="text-muted text-sm">Nenhum caderno aguardando avaliação.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendentes.slice(0, 5).map(q => {
              const membro = q.profiles as { nome: string; email: string } | null
              const info = CADERNO_INFO[q.numero_caderno as CadernoNumero]
              return (
                <Link key={q.id} href={`/facilitador/aprovacoes/${q.id}`}>
                  <div className="card border border-warm/20 hover:border-gold/40 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-warm/10 border border-warm/20 flex items-center justify-center font-display text-lg font-bold text-warm flex-shrink-0">
                        {info.letra}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-paper text-sm font-medium">{membro?.nome ?? 'Membro'}</p>
                        <p className="text-muted text-xs">
                          Caderno {q.numero_caderno} — {info.nome} · {formatDate(q.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-warm/10 border border-warm/20 text-warm">
                          ⏳ Pendente
                        </span>
                        <ChevronRight size={14} className="text-muted group-hover:text-gold transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recentes */}
      {(recentes?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-display text-xl text-paper mb-4">Avaliações recentes</h2>
          <div className="space-y-2">
            {recentes!.map(q => {
              const membro = q.profiles as { nome: string; email: string } | null
              const info = CADERNO_INFO[q.numero_caderno as CadernoNumero]
              const statusColor = q.status === 'aprovado'
                ? 'text-gold bg-gold/10 border-gold/20'
                : 'text-accent bg-accent/10 border-accent/20'
              const statusLabel = q.status === 'aprovado' ? '✅ Aprovado' : q.status === 'ajustar' ? '⚠️ Ajustar' : '🔄 Reaplicar'
              return (
                <div key={q.id} className="card opacity-70">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-dark-4 flex items-center justify-center font-display text-lg font-bold text-muted flex-shrink-0">
                      {info.letra}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-paper text-sm">{membro?.nome ?? 'Membro'}</p>
                      <p className="text-muted text-xs">Caderno {q.numero_caderno} — {info.nome}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
