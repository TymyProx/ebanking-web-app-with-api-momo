/**
 * Utilitaires pour normaliser et afficher les statuts des comptes
 * 
 * Ce fichier gère l'incohérence des formats de statut retournés par l'API
 * (0, 1, "ACTIF", "Actif", etc.) et les convertit en format lisible uniforme
 */

/**
 * Normalise le statut d'un compte retourné par l'API
 * Convertit tous les formats possibles (number, string, majuscules, minuscules)
 * en format lisible standardisé
 * 
 * @param status - Le statut brut retourné par l'API
 * @returns Un statut normalisé lisible ("Actif", "En attente", etc.)
 */
export function normalizeAccountStatus(status: number | string | undefined | null): string {
  // Gérer les valeurs nulles ou undefined
  if (status === null || status === undefined) {
    return "Inconnu"
  }

  // Convertir en string et en majuscules pour comparaison
  const statusStr = String(status).toUpperCase().trim()
  
  // Mapper les statuts numériques et textuels - EN ATTENTE
  if (
    status === 0 || 
    status === "0" ||
    statusStr === "PENDING" || 
    statusStr === "EN ATTENTE" ||
    statusStr === "EN_ATTENTE"
  ) {
    return "En attente"
  }
  
  // Mapper les statuts numériques et textuels - ACTIF
  if (
    status === 1 || 
    status === "1" ||
    statusStr === "ACTIF" || 
    statusStr === "ACTIVE" || 
    statusStr === "APPROVED"
  ) {
    return "Actif"
  }
  
  // Mapper les statuts numériques et textuels - REJETÉ
  if (
    status === 2 || 
    status === "2" ||
    statusStr === "REJECTED" || 
    statusStr === "REJETÉ" ||
    statusStr === "REJETÉE"
  ) {
    return "Rejeté"
  }
  
  // Mapper les statuts numériques et textuels - FERMÉ
  if (
    status === -1 || 
    status === "-1" ||
    statusStr === "CLOSED" || 
    statusStr === "FERMÉ" ||
    statusStr === "FERMÉE"
  ) {
    return "Fermé"
  }
  
  // Mapper les statuts BLOQUÉ
  if (
    statusStr === "BLOCKED" || 
    statusStr === "BLOQUÉ" ||
    statusStr === "BLOQUÉE"
  ) {
    return "Bloqué"
  }
  
  // Par défaut, retourner le statut avec première lettre en majuscule
  if (statusStr.length > 0) {
    return statusStr.charAt(0) + statusStr.slice(1).toLowerCase()
  }
  
  return "Inconnu"
}

/**
 * Type pour les informations de badge de statut
 */
export interface StatusBadgeInfo {
  label: string
  className: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

/**
 * Retourne les informations de badge pour un statut donné
 * Utilisé pour afficher le badge avec les bonnes couleurs et texte
 * 
 * @param status - Le statut brut retourné par l'API
 * @returns Un objet contenant le label, la classe CSS et le variant
 */
export function getAccountStatusBadge(status: number | string | undefined | null): StatusBadgeInfo {
  const normalizedStatus = normalizeAccountStatus(status)
  
  switch (normalizedStatus) {
    case "Actif":
      return { 
        label: "Actif", 
        className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        variant: "default"
      }
    
    case "En attente":
      return { 
        label: "En attente", 
        className: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
        variant: "secondary"
      }
    
    case "Bloqué":
      return { 
        label: "Bloqué", 
        className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
        variant: "destructive"
      }
    
    case "Fermé":
      return { 
        label: "Fermé", 
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
        variant: "secondary"
      }
    
    case "Rejeté":
      return { 
        label: "Rejeté", 
        className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
        variant: "destructive"
      }
    
    default:
      return { 
        label: normalizedStatus, 
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        variant: "outline"
      }
  }
}

/**
 * Vérifie si un compte est actif (peut effectuer des transactions)
 * 
 * @param status - Le statut du compte
 * @returns true si le compte est actif, false sinon
 */
export function isAccountActive(status: number | string | undefined | null): boolean {
  const normalized = normalizeAccountStatus(status)
  return normalized === "Actif"
}

/**
 * Vérifie si un compte est en attente de validation
 * 
 * @param status - Le statut du compte
 * @returns true si le compte est en attente, false sinon
 */
export function isAccountPending(status: number | string | undefined | null): boolean {
  const normalized = normalizeAccountStatus(status)
  return normalized === "En attente"
}

/**
 * Filtre une liste de comptes par statut
 * 
 * @param accounts - Liste des comptes
 * @param filterStatus - Le statut à filtrer ("ACTIF", "PENDING", "ALL", etc.)
 * @returns Liste filtrée des comptes
 */
export function filterAccountsByStatus<T extends { status: number | string | undefined | null }>(
  accounts: T[],
  filterStatus: string
): T[] {
  if (filterStatus === "ALL" || filterStatus === "TOUS") {
    return accounts
  }

  return accounts.filter((account) => {
    const normalizedAccountStatus = normalizeAccountStatus(account.status)
    const normalizedFilterStatus = normalizeAccountStatus(filterStatus)
    return normalizedAccountStatus === normalizedFilterStatus
  })
}

/**
 * Compte le nombre de comptes par statut
 * 
 * @param accounts - Liste des comptes
 * @returns Un objet avec le nombre de comptes par statut
 */
export function countAccountsByStatus<T extends { status: number | string | undefined | null }>(
  accounts: T[]
): Record<string, number> {
  return accounts.reduce((acc, account) => {
    const status = normalizeAccountStatus(account.status)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

