import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED = ["/home", "/documents", "/sheets", "/slides", "/pdf", "/files", "/search", "/knowledge", "/automation", "/templates", "/settings"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
  const isProtected = pathname === "/" || PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"))

  const hasSession = [...request.cookies.getAll()].some(c =>
    c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  )

  if (!hasSession && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
