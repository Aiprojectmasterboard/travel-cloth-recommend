import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  // Validate redirect target against the known site URL to prevent open redirects.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://travelcapsule.ai'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
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

  return NextResponse.redirect(`${siteUrl}/`)
}
