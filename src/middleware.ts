import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Role } from '@/types'

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ['/login', '/']

// Mapa de rotas → roles permitidos
const PROTECTED_ROUTES: Record<string, Role[]> = {
  '/membro':      ['membro', 'facilitador', 'mentor', 'guardiao', 'ordenista'],
  '/facilitador': ['facilitador', 'mentor', 'guardiao', 'ordenista'],
  '/mentor':      ['mentor', 'guardiao', 'ordenista'],
  '/guardiao':    ['guardiao', 'ordenista'],
  '/ordenista':   ['ordenista'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Se não está logado e tenta acessar rota protegida → login
  if (!user && !PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se está logado e tenta acessar login → redirecionar para área
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role as Role) ?? 'membro'
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }

  // Verificar permissão por role
  if (user) {
    const matchedRoute = Object.keys(PROTECTED_ROUTES).find(r =>
      pathname.startsWith(r)
    )

    if (matchedRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile?.role as Role) ?? 'membro'
      const allowed = PROTECTED_ROUTES[matchedRoute]

      if (!allowed.includes(role)) {
        return NextResponse.redirect(new URL(`/${role}`, request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
