'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Profile, ROLE_LABEL } from '@/types'
import { cn, getInitials } from '@/lib/utils'
import {
  BookOpen, Users, CheckSquare, Award,
  BarChart2, Settings, LogOut, Flame,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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

      {/* Profile pill */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded bg-dark-4">
          <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-ink text-xs font-medium">
              {getInitials(profile.nome)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-paper text-sm truncate">{profile.nome}</p>
            <span className="badge-role text-[10px] px-2 py-0.5">
              {ROLE_LABEL[profile.role]}
            </span>
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
