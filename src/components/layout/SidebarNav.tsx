'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Profile, ROLE_LABEL } from '@/types'
import { cn, getInitials } from '@/lib/utils'
import { useEffect, useState, useRef } from 'react'
import {
  BookOpen, Users, CheckSquare, Award,
  BarChart2, Settings, LogOut, Flame,
  ChevronRight, Bell, X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface Notificacao {
  id: string
  tipo: string
  mensagem: string
  link: string | null
  lida: boolean
  created_at: string
}

function getNavItems(role: Profile['role']): NavItem[] {
  const items: NavItem[] = [
    { href: '/membro', label: 'Meus Cadernos', icon: BookOpen },
  ]
  if (['facilitador', 'mentor', 'guardiao', 'ordenista'].includes(role)) {
    items.push({ href: '/facilitador', label: 'Minha Turma', icon: Users })
    items.push({ href: '/facilitador/aprovacoes', label: 'Aprovações', icon: CheckSquare })
  }
  if (['mentor', 'guardiao', 'ordenista'].includes(role)) {
    items.push({ href: '/mentor', label: 'Gestão de Turmas', icon: BarChart2 })
    items.push({ href: '/mentor/formacao', label: 'Formação', icon: Award })
  }
  if (['guardiao', 'ordenista'].includes(role)) {
    items.push({ href: '/guardiao', label: 'Guardiões', icon: Award })
  }
  if (role === 'ordenista') {
    items.push({ href: '/ordenista', label: 'Painel Ordenista', icon: Settings })
  }
  return items
}

export default function SidebarNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = getNavItems(profile.role)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const naoLidas = notificacoes.filter(n => !n.lida).length

  useEffect(() => {
    carregarNotificacoes()
    // Polling a cada 30s
    const interval = setInterval(carregarNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function carregarNotificacoes() {
    const res = await fetch('/api/notificacoes')
    if (res.ok) {
      const data = await res.json()
      setNotificacoes(data.notificacoes ?? [])
    }
  }

  async function marcarLida(id: string) {
    await fetch('/api/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  async function marcarTodasLidas() {
    await fetch('/api/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
  }

  async function handleNotifClick(notif: Notificacao) {
    await marcarLida(notif.id)
    setShowNotif(false)
    if (notif.link) router.push(notif.link)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function formatTempo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'agora'
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-2 border-r border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <Flame className="text-gold" size={16} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-paper text-sm tracking-wider">I.P.E.M</p>
            <p className="text-muted text-xs tracking-widest uppercase">Ordenismo</p>
          </div>
        </div>
      </div>

      {/* Profile pill + sino */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-2 py-2 rounded bg-dark-4 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-ink text-xs font-medium">{getInitials(profile.nome)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-paper text-sm truncate">{profile.nome}</p>
              <span className="badge-role text-[10px] px-2 py-0.5">{ROLE_LABEL[profile.role]}</span>
            </div>
          </div>

          {/* Sino de notificações */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              style={{
                position: 'relative', width: '36px', height: '36px',
                borderRadius: '8px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: naoLidas > 0 ? '#d4a843' : '#7a7060',
                flexShrink: 0,
              }}
            >
              <Bell size={15} strokeWidth={1.5} />
              {naoLidas > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: '#d4a843', color: '#1a1713',
                  fontSize: '9px', fontWeight: '700',
                  width: '16px', height: '16px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

            {/* Dropdown notificações */}
            {showNotif && (
              <div style={{
                position: 'absolute', top: '44px', left: 0,
                width: '300px', background: '#1a1713',
                border: '1px solid rgba(212,168,67,0.15)',
                borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 200,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#f5f0e8', letterSpacing: '1px' }}>NOTIFICAÇÕES</p>
                  {naoLidas > 0 && (
                    <button onClick={marcarTodasLidas} style={{ fontSize: '11px', color: '#c8a96e', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notificacoes.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#7a7060', fontSize: '13px' }}>
                      Nenhuma notificação.
                    </div>
                  ) : notificacoes.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: n.lida ? 'transparent' : 'rgba(212,168,67,0.04)',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.lida ? 'transparent' : '#d4a843', marginTop: '5px', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', color: n.lida ? '#7a7060' : '#f5f0e8', lineHeight: '1.5' }}>{n.mensagem}</p>
                        <p style={{ fontSize: '10px', color: '#7a7060', marginTop: '2px' }}>{formatTempo(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 group',
                active
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-muted hover:text-paper hover:bg-dark-4'
              )}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={12} className="text-gold/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-muted hover:text-paper hover:bg-dark-4 w-full transition-all duration-150"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
