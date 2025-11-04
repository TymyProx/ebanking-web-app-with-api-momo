// Utility functions for RIB formatting (NOT server actions)
// This file does NOT have "use server" directive

export interface UserProfile {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  email: string
  phoneNumber?: string
}

export interface RibInfo {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string
  availableBalance: string
  status: string
  type: string
  codeAgence?: string
  codeBanque?: string
  cleRib?: string
  clientId: string
}

/**
 * Génère un RIB à partir des données du compte et du profil utilisateur
 * @pure Cette fonction n'a pas d'effets secondaires
 */
export function generateRibData(account: RibInfo, userProfile: UserProfile | null) {
  const accountHolder = userProfile
    ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || userProfile.email
    : "Titulaire du compte"

  // Construire l'IBAN si non disponible
  let iban = account.accountNumber
  if (account.accountNumber && !account.accountNumber.startsWith("GN")) {
    iban = `GN82 ${account.codeBanque || "BNG"} ${account.codeAgence || "001"} ${account.accountNumber}`
  }

  // Construire le RIB brut
  const ribRaw = `${account.codeBanque || "BNG"}${account.codeAgence || "001"}${(account.accountNumber || "").replace(/-/g, "")}${account.cleRib || ""}`

  return {
    accountHolder,
    iban: iban.trim(),
    ribRaw,
    bankCode: account.codeBanque || "BNG",
    branchCode: account.codeAgence || "001",
    bankName: "Banque Nationale de Guinée",
    swiftCode: "BNGNGNCX",
    branchName: "Agence " + (account.codeAgence || "Centrale"),
  }
}
