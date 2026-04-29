import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CADERNO_INFO, type CadernoNumero } from '@/types'
import { ChevronRight, Inbox } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AprovacoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pendentes } = await supabase
    .from('questionarios')
    .select('*, profiles:membro_id(nome, email)')
    .eq('status', 'aguardando_aprovacao')
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-3xl">

      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest mb-2">Mediador</p>
        <h1 className="font-display text-4xl text-paper mb-2">Aprovações</h1>
        <p className="text-muted text-sm">
          {pendentes?.length
            ? `${pendentes.length} caderno${pendentes.length > 1 ? 's' : ''} aguardando sua avaliação.`
            : 'Nenhum caderno pendente no momento.'}
        </p>
      </div>

      {!pendentes?.length ? (
        <div className="card text-center py-16">
          <Inbox size={40} className="text-muted mx-auto mb-4" strokeWidth={1} />
          <p className="text-muted">Tudo em dia. Nenhum caderno pendente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendentes.map(q => {
            const membro = q.profiles as { nome: string; email: string } | null
            const info = CADERNO_INFO[q.numero_caderno as CadernoNumero]
            return (
              <Link key={q.id} href={`/facilitador/aprovacoes/${q.id}`}>
                <div className="card border border-warm/20 hover:border-gold/40 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-warm/10 border border-warm/20 flex items-center justify-center font-display text-xl font-bold text-warm flex-shrink-0">
                      {info.letra}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-paper text-sm font-medium">{membro?.nome ?? 'Membro'}</p>
                      <p className="text-muted text-xs mb-1">{membro?.email}</p>
                      <p className="text-warm text-xs">
                        Caderno {q.numero_caderno} — {info.nome}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-muted text-xs mb-2">{formatDate(q.updated_at)}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs px-2 py-1 rounded-full bg-warm/10 border border-warm/20 text-warm">
                          ⏳ Pendente
                        </span>
                        <ChevronRight size={14} className="text-muted group-hover:text-gold transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
