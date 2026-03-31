import { redirect } from "next/navigation"

/** La racine `/` redirige vers la page de connexion (plus de page d’accueil marketing). */
export default function RootPage() {
  redirect("/login")
}
