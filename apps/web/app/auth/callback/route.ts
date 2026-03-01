import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const oauthError = requestUrl.searchParams.get('error')

  // Use the request origin so redirects stay on the same domain the user is on
  // (e.g. pages.dev vs travelscapsule.com). Fall back to env or hardcoded value.
  const allowedOrigins = [
    'https://travelscapsule.com',
    'https://www.travelscapsule.com',
    'https://travel-cloth-recommend.pages.dev',
  ]
  const requestOrigin = requestUrl.origin
  const siteUrl = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://travelscapsule.com')

  // Supabase sends ?error=access_denied when user cancels OAuth or provider rejects
  if (oauthError) {
    return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // Ensure cookies persist on mobile browsers
                sameSite: 'lax' as const,
                secure: true,
                path: '/',
              })
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${siteUrl}/auth/login?error=auth_failed`)
    }

    // Password recovery flow → redirect to account page with reset flag
    if (type === 'recovery') {
      return NextResponse.redirect(`${siteUrl}/account?reset=true`)
    }
  }

  return NextResponse.redirect(`${siteUrl}/trip`)
}
