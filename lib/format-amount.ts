/** Espace large entre les groupes de milliers (double espace cadratin). */
export const WIDE_THOUSAND_SEPARATOR = "\u2003\u2003"

export function applyWideThousandSeparators(formatted: string): string {
  return formatted.replace(/[\s\u00A0\u202F\u2009]/g, WIDE_THOUSAND_SEPARATOR)
}

/**
 * Formate un montant de solde avec des séparateurs de milliers plus espacés.
 */
export function formatBalanceAmount(amount: number | string, currency = "GNF"): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  const safeAmount = Number.isFinite(numAmount) ? numAmount : 0

  if (currency === "GNF") {
    return applyWideThousandSeparators(
      new Intl.NumberFormat("fr-FR").format(Math.trunc(Math.abs(safeAmount))),
    )
  }

  return applyWideThousandSeparators(
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(safeAmount),
  )
}
