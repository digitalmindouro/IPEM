import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CADERNO_INFO, ROLE_LABEL, type CadernoNumero, type StatusCaderno, type Profile, type Questionario } from '@/types'
import { cn } from '@/lib/utils'
import { Lock, ChevronRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'

function statusCor(status: StatusCaderno | undefined): string {
  switch (status) {
    case 'aprovado': return 'border-gold/40 bg-gold/5'
    case 'aguardando_aprovacao': return 'border-warm/30 bg-warm/5'
    case 'em_andamento': return 'border-white/20 bg-white/5'
    case 'ajustar':
    case 'reaplicar': return 'border-accent/40 bg-accent/5'
    case 'disponivel': return 'border-white/10 bg-dark-3 hover:border-gold/30'
    default: return 'border-white/5 bg-dark-3 opacity-50'
  }
}

function StatusIcon({ status }: { status: StatusCaderno | undefined }) {
  switch (status) {
    case 'aprovado': return <CheckCircle size={16} className="text-gold" strokeWidth={1.5} />
    case 'aguardando_aprovacao': return <Clock size={16} className="text-warm" strokeWidth={1.5} />
    case 'ajustar':
    case 'reaplicar': return <AlertCircle size={16} className="text-accent" strokeWidth={1.5} />
    case 'bloqueado': return <Lock size={16} className="text-muted" strokeWidth={1.5} />
    default: return null
  }
}

function statusLabel(status: StatusCaderno | undefined): string {
  switch (status) {
    case 'aprovado': return 'Aprovado'
    case 'aguardando_aprovacao': return 'Aguardando avaliação'
    case 'em_andamento': return 'Em andamento'
    case 'ajustar': return 'Revisar'
    case 'reaplicar': return 'Reaplicar'
    case 'disponivel': return 'Disponível'
    default: return 'Bloqueado'
  }
}

export default async function MembroPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: questionarios } = await supabase
    .from('questionarios')
    .select('*')
    .eq('membro_id', user.id)
    .order('numero_caderno')

  const cadernoMap = new Map<number, any>()
  questionarios?.forEach(q => cadernoMap.set(q.numero_caderno, q))

  function getStatus(num: CadernoNumero): StatusCaderno {
    const q = cadernoMap.get(num)
    if (q) return q.status as StatusCaderno
    if (num === 1) return 'disponivel'
    const anterior = cadernoMap.get(num - 1)
    if (anterior?.status === 'aprovado') return 'disponivel'
    return 'bloqueado'
  }

  const cadernos = ([1, 2, 3, 4] as CadernoNumero[]).map(num => ({
    num, info: CADERNO_INFO[num], status: getStatus(num), questionario: cadernoMap.get(num),
  }))

  const aprovados = cadernos.filter(c => c.status === 'aprovado').length
  const percentual = Math.round((aprovados / 4) * 100)

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p className="text-muted text-xs uppercase tracking-widest mb-2">
          {ROLE_LABEL[profile.role as keyof typeof ROLE_LABEL]}
        </p>
        <h1 className="font-display text-4xl text-paper mb-2">
          Bem-vindo, {profile.nome.split(' ')[0]}.
        </h1>
        <p className="text-muted text-sm">Siga a sequência. Cada caderno sustenta o próximo.</p>
      </div>

      <div className="card-gold mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted">Progresso I.P.E.M</p>
          <p className="text-gold font-medium">{aprovados}/4 cadernos</p>
        </div>
        <div className="h-1.5 bg-dark-5 rounded-full overflow-hidden">
          <div className="h-full bg-gold-gradient rounded-full transition-all duration-700" style={{ width: `${percentual}%` }} />
        </div>
        <p className="text-right text-xs text-muted mt-2">{percentual}% concluído</p>
      </div>

      <div className="space-y-3">
        {cadernos.map(({ num, info, status }) => {
          const isClickable = status !== 'bloqueado'
          const inner = (
            <div className={cn('card border transition-all duration-200 group', statusCor(status), isClickable && 'cursor-pointer')}>
              <div className="flex items-center gap-5">
                <div className={cn('w-14 h-14 rounded flex items-center justify-center flex-shrink-0 font-display text-2xl font-bold',
                  status === 'aprovado' ? 'bg-gold/20 text-gold' : status === 'bloqueado' ? 'bg-dark-5 text-muted' : 'bg-dark-4 text-warm')}>
                  {info.letra}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-paper text-sm font-medium">Caderno {num} — {info.nome}</p>
                    <StatusIcon status={status} />
                  </div>
                  <p className="text-muted text-xs leading-relaxed line-clamp-1">{info.descricao}</p>
                  <p className={cn('text-xs mt-1.5 font-medium',
                    status === 'aprovado' ? 'text-gold' : status === 'aguardando_aprovacao' ? 'text-warm' :
                    status === 'ajustar' || status === 'reaplicar' ? 'text-accent' : 'text-muted')}>
                    {statusLabel(status)}
                  </p>
                </div>
                {isClickable && <ChevronRight size={16} className="text-muted group-hover:text-gold transition-colors flex-shrink-0" strokeWidth={1.5} />}
              </div>
            </div>
          )
          return isClickable
            ? <a key={num} href={`/membro/cadernos/${num}`}>{inner}</a>
            : <div key={num}>{inner}</div>
        })}
      </div>
    </div>
  )
}
