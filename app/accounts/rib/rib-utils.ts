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
    ? (userProfile.fullName || `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || "TITULAIRE")
    : "TITULAIRE"

  // Construire l'IBAN si non disponible
  // Format IBAN: GN82 + Code banque (3) + Code agence (3) + Numéro compte (10) + Clé RIB (2)
  let iban = account.accountNumber || ""
  if (iban && !iban.startsWith("GN")) {
    const bankCode = (account.codeBanque || "022").padStart(3, "0").slice(0, 3)
    const branchCode = (account.codeAgence || "001").padStart(3, "0").slice(0, 3)
    const accountNumberClean = iban.replace(/-/g, "").replace(/\s/g, "")
    const numeroCompte = accountNumberClean.length > 10 
      ? accountNumberClean.slice(0, 10) 
      : accountNumberClean.padStart(10, "0").slice(0, 10)
    const cleRib = account.cleRib 
      ? String(account.cleRib).padStart(2, "0").slice(0, 2)
      : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")
    iban = `GN82${bankCode}${branchCode}${numeroCompte}${cleRib}`
  }

  // Format RIB: Code banque (3) + Code agence (3) + Numéro compte (10) + Clé RIB (2)
  const bankCode = (account.codeBanque || "022").padStart(3, "0").slice(0, 3)
  const branchCode = (account.codeAgence || "001").padStart(3, "0").slice(0, 3)
  const accountNumberClean = (account.accountNumber || "").replace(/-/g, "").replace(/\s/g, "")
  const numeroCompte = accountNumberClean.length > 10 
    ? accountNumberClean.slice(0, 10) 
    : accountNumberClean.padStart(10, "0").slice(0, 10)
  const cleRib = account.cleRib 
    ? String(account.cleRib).padStart(2, "0").slice(0, 2)
    : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")
  const ribRaw = `${bankCode}${branchCode}${numeroCompte}${cleRib}`

  return {
    accountHolder,
    iban: iban.trim(),
    ribRaw,
    bankCode: (account.codeBanque || "022").padStart(3, "0").slice(0, 3),
    branchCode: (account.codeAgence || "001").padStart(3, "0").slice(0, 3),
    bankName: "Banque Nationale de Guinée",
    swiftCode: "BNGNGNCX",
    branchName: "Agence " + (account.codeAgence || "Centrale"),
  }
}
