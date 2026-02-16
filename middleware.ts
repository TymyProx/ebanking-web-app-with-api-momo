import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Pages publiques qui ne nécessitent pas d'authentification
const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/auth/verify-email",
  "/auth/accept-invite",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si c'est une page publique
  const isPublicPage = publicPaths.some((path) => pathname.startsWith(path))

  // Si c'est une page publique, laisser passer
  if (isPublicPage) {
    return NextResponse.next()
  }

  // Pour toutes les autres pages, vérifier la présence du cookie "token"
  const token = request.cookies.get("token")

  // Si pas de token, rediriger vers la page de connexion
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    // Ajouter le chemin d'origine comme paramètre pour rediriger après connexion
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si le token existe, laisser passer
  return NextResponse.next()
}

// Configurer les chemins sur lesquels le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
