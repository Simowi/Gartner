import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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
  const erBeskyttet = pathname.startsWith('/hjem') || pathname.startsWith('/planter') || pathname.startsWith('/kalender') || pathname.startsWith('/chat')
  const erAuth = pathname.startsWith('/logg-inn') || pathname.startsWith('/registrer')

  if (!user && erBeskyttet) {
    const url = request.nextUrl.clone()
    url.pathname = '/logg-inn'
    return NextResponse.redirect(url)
  }

  if (user && erAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/hjem'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|sw.js).*)'],
}
