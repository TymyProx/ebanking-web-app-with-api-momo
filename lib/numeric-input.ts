/**
 * Utilitaires pour les champs de saisie numériques
 * Permet de saisir uniquement des chiffres sans espaces ni caractères spéciaux
 */

/**
 * Nettoie la valeur pour ne garder que les chiffres
 * @param value - La valeur à nettoyer
 * @returns La valeur avec uniquement des chiffres
 */
export function cleanNumericInput(value: string): string {
  // Retirer tous les caractères non numériques
  return value.replace(/\D/g, "")
}

/**
 * Gère le changement de valeur pour un champ numérique
 * Nettoie automatiquement la valeur pour ne garder que les chiffres
 * @param value - La nouvelle valeur
 * @returns La valeur nettoyée (chiffres uniquement)
 */
export function handleNumericChange(value: string): string {
  return cleanNumericInput(value)
}

/**
 * Valide qu'une valeur est un nombre valide
 * @param value - La valeur à valider
 * @returns true si la valeur est un nombre valide, false sinon
 */
export function isValidNumber(value: string): boolean {
  if (!value || value.trim() === "") return false
  const cleaned = cleanNumericInput(value)
  return cleaned.length > 0 && !isNaN(Number(cleaned))
}

/**
 * Convertit une valeur nettoyée en nombre
 * @param value - La valeur à convertir
 * @returns Le nombre ou 0 si invalide
 */
export function toNumber(value: string): number {
  const cleaned = cleanNumericInput(value)
  return cleaned ? Number(cleaned) : 0
}
