import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = [
  "/",
  "/agences",
  "/support",
  "/login",
  "/auth/verify-email",
  "/auth/accept-invite",
  "/auth/forgot-password",
  "/auth/password-reset",
]

/**
 * L'auth est gérée côté client (sessionStorage + cookies HttpOnly par onglet).
 * Le middleware ne doit plus bloquer via un cookie `token` partagé.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (
    request.method === "POST" &&
    (pathname.startsWith("/auth/password-reset") || pathname.startsWith("/auth/forgot-password"))
  ) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, request.url)
    return NextResponse.redirect(url, 303)
  }

  const isPublicPage = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  const response = isPublicPage ? NextResponse.next() : NextResponse.next()

  if (request.cookies.get("token")) {
    response.cookies.delete("token")
  }
  if (request.cookies.get("user")) {
    response.cookies.delete("user")
  }
  if (request.cookies.get("auth_tab_id")) {
    response.cookies.delete("auth_tab_id")
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
