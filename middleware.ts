import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const pathname = request.nextUrl.pathname

  const isAuthPage =
    pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/")

  const isAcceptInvitePage = pathname.startsWith("/auth/accept-invite")

  if (isAcceptInvitePage) {
    return NextResponse.next()
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/accounts/balance", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|placeholder-).*)"],
}
