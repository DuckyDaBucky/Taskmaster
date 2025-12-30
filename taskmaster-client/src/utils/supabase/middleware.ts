import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't need any auth processing
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/callback']

// Routes that need session refresh (protected routes)
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/onboarding', '/api']

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.includes(pathname) || 
           pathname.startsWith('/_next') || 
           pathname.startsWith('/static') ||
           pathname.includes('.')
}

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Skip ALL processing for public routes - instant response
    if (isPublicRoute(pathname)) {
        return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse
    }

    // Check if auth cookie exists - if not, redirect to login for protected routes
    const authCookie = request.cookies.get('sb-access-token') || 
                       request.cookies.getAll().find(c => c.name.includes('-auth-token'))
    
    if (!authCookie && isProtectedRoute(pathname)) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Only create Supabase client and refresh for protected routes
    if (!isProtectedRoute(pathname)) {
        return supabaseResponse
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
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

        // Use getSession first - it only reads cookies (fast, no network)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
            // Check if token expires within 5 minutes - only then refresh
            const expiresAt = session.expires_at
            const now = Math.floor(Date.now() / 1000)
            const fiveMinutes = 5 * 60
            
            if (expiresAt && (expiresAt - now) < fiveMinutes) {
                // Token expiring soon - refresh it (this is the only network call)
                await supabase.auth.getUser()
            }
        } else if (isProtectedRoute(pathname)) {
            // No session but trying to access protected route
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    } catch (error) {
        // Silent fail - let route handle auth
    }

    return supabaseResponse
}
