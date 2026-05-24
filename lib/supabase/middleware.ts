import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )
    
    const authPromise = supabase.auth.getUser()
    
    const {
      data: { user },
    } = await Promise.race([authPromise, timeoutPromise]) as any

    // Protect dashboard routes
    if (
      (request.nextUrl.pathname.startsWith('/student') ||
        request.nextUrl.pathname.startsWith('/teacher')) &&
      !user
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users from auth pages to their dashboard
    if (request.nextUrl.pathname.startsWith('/auth') && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const url = request.nextUrl.clone()
        url.pathname = profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
        return NextResponse.redirect(url)
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without auth check if timeout occurs
  }

  return supabaseResponse
}
