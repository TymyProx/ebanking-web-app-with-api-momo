export type ThousandSeparatorSpacing = "none" | "subtle" | "wide"

const THOUSAND_SEPARATORS: Record<Exclude<ThousandSeparatorSpacing, "none">, string> = {
  /** Légèrement plus visible que le format fr-FR standard. */
  subtle: "\u2002",
  /** Espacement marqué pour les pages détail. */
  wide: "\u2003",
}

export function applyThousandSeparators(
  formatted: string,
  spacing: ThousandSeparatorSpacing = "wide",
): string {
  if (spacing === "none") {
    return formatted
  }

  const separator = THOUSAND_SEPARATORS[spacing]
  return formatted.replace(/[\s\u00A0\u202F\u2009\u2002\u2003]/g, separator)
}

/**
 * Formate un montant de solde avec séparateurs de milliers configurables.
 */
export function formatBalanceAmount(
  amount: number | string,
  currency = "GNF",
  spacing: ThousandSeparatorSpacing = "wide",
): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  const safeAmount = Number.isFinite(numAmount) ? numAmount : 0

  if (currency === "GNF") {
    return applyThousandSeparators(
      new Intl.NumberFormat("fr-FR").format(Math.trunc(Math.abs(safeAmount))),
      spacing,
    )
  }

  return applyThousandSeparators(
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(safeAmount),
    spacing,
  )
}
