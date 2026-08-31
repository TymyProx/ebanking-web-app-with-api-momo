export const STATEMENT_ONLINE_MAX_MONTHS = 6

export const STATEMENT_PERIOD_TOO_OLD_MESSAGE =
  "Pour les relevés de plus de 6 mois, veuillez vous rendre en agence."

/** Désactive la limite 6 mois par défaut (mode test). Mettre NEXT_PUBLIC_STATEMENT_TEST_MODE=false en prod. */
export function isStatementTestMode(): boolean {
  const value = process.env.NEXT_PUBLIC_STATEMENT_TEST_MODE
  if (value === undefined || value.trim() === "") return true
  return value.trim().toLowerCase() !== "false"
}

export function isStatementPeriodLimitEnabled(): boolean {
  return !isStatementTestMode()
}

export function parseStatementDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`)
}

/** Date de début la plus ancienne autorisée en ligne (aujourd'hui − 6 mois). */
export function getEarliestOnlineStatementStartDate(reference = new Date()): Date {
  const limit = new Date(reference)
  limit.setHours(0, 0, 0, 0)
  limit.setMonth(limit.getMonth() - STATEMENT_ONLINE_MAX_MONTHS)
  return limit
}

export function isStatementStartDateTooOld(startDate: string, reference = new Date()): boolean {
  if (!isStatementPeriodLimitEnabled()) return false
  if (!startDate) return false
  const start = parseStatementDate(startDate)
  return start < getEarliestOnlineStatementStartDate(reference)
}
