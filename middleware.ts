import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED = ["/home", "/documents", "/sheets", "/slides", "/pdf", "/files", "/search", "/knowledge", "/automation", "/templates", "/settings"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
  const isProtected = pathname === "/" || PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
