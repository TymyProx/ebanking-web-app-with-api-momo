import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const pathname = request.nextUrl.pathname

  const isAuthPage =
    pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/")

  // Page d'activation spéciale
  const isAcceptInvitePage = pathname.startsWith("/auth/accept-invite")

  console.log("[E-banking Middleware] Pathname:", pathname)
  console.log("[E-banking Middleware] Has token:", !!token)
  if (token) {
    console.log("[E-banking Middleware] Token preview:", token.substring(0, 20) + "...")
  }
  console.log("[E-banking Middleware] Is auth page:", isAuthPage)
  console.log("[E-banking Middleware] Is accept-invite page:", isAcceptInvitePage)

  // Permettre l'accès à la page d'activation sans authentification
  if (isAcceptInvitePage) {
    console.log("[E-banking Middleware] Allowing access to accept-invite page")
    return NextResponse.next()
  }

  // Si l'utilisateur n'est pas authentifié et essaie d'accéder à des routes protégées
  if (!token && !isAuthPage) {
    console.log("[E-banking Middleware] Redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    console.log("[E-banking Middleware] Redirecting authenticated user to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  console.log("[E-banking Middleware] Allowing request to proceed")
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     * - placeholder-* (placeholder images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|placeholder-).*)",
  ],
}
