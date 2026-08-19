import { cookies } from "next/headers"

import { tokenCookieName } from "./auth-cookie-names"



/**

 * Résout le JWT pour les server actions (cookie HttpOnly par onglet).

 * tabId doit être fourni depuis le client (sessionStorage) — pas de cookie partagé.

 */

export async function getServerAuthToken(tabId?: string): Promise<string | undefined> {

  const cookieStore = await cookies()



  if (tabId) {

    const scoped = cookieStore.get(tokenCookieName(tabId))?.value

    if (scoped) return scoped

  }



  return cookieStore.get("token")?.value

}

