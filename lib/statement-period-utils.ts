export const STATEMENT_ONLINE_MAX_MONTHS = 6

export const STATEMENT_PERIOD_TOO_OLD_MESSAGE =
  "Pour consulter un relevé dont la date de début remonte à plus de 6 mois, veuillez vous rendre en agence."

export const STATEMENT_PERIOD_TOO_LONG_MESSAGE =
  "La période sélectionnée ne peut pas dépasser 6 mois. Veuillez réduire la plage de dates."

/** Active le mode test (sans limite 6 mois) via NEXT_PUBLIC_STATEMENT_TEST_MODE=true */
export function isStatementTestMode(): boolean {
  const value = process.env.NEXT_PUBLIC_STATEMENT_TEST_MODE
  if (value === undefined || value.trim() === "") return false
  return value.trim().toLowerCase() === "true"
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

/** Date de fin maximale autorisée pour une date de début donnée (début + 6 mois, plafonnée à aujourd'hui). */
export function getMaxStatementEndDate(startDate: string, reference = new Date()): Date {
  const start = parseStatementDate(startDate)
  const maxEnd = new Date(start)
  maxEnd.setMonth(maxEnd.getMonth() + STATEMENT_ONLINE_MAX_MONTHS)
  maxEnd.setHours(23, 59, 59, 999)

  const todayEnd = new Date(reference)
  todayEnd.setHours(23, 59, 59, 999)

  return maxEnd < todayEnd ? maxEnd : todayEnd
}

export function isStatementStartDateTooOld(startDate: string, reference = new Date()): boolean {
  if (!isStatementPeriodLimitEnabled()) return false
  if (!startDate) return false
  const start = parseStatementDate(startDate)
  return start < getEarliestOnlineStatementStartDate(reference)
}

export function isStatementPeriodSpanTooLong(startDate: string, endDate: string): boolean {
  if (!isStatementPeriodLimitEnabled()) return false
  if (!startDate || !endDate) return false

  const start = parseStatementDate(startDate)
  const end = parseStatementDate(endDate)
  if (end < start) return false

  const maxAllowedEnd = new Date(start)
  maxAllowedEnd.setMonth(maxAllowedEnd.getMonth() + STATEMENT_ONLINE_MAX_MONTHS)
  maxAllowedEnd.setHours(0, 0, 0, 0)

  return end > maxAllowedEnd
}

export function getStatementPeriodError(
  startDate: string,
  endDate: string,
  reference = new Date(),
): string | null {
  if (!isStatementPeriodLimitEnabled()) return null
  if (!startDate || !endDate) return null

  if (isStatementStartDateTooOld(startDate, reference)) {
    return STATEMENT_PERIOD_TOO_OLD_MESSAGE
  }

  if (isStatementPeriodSpanTooLong(startDate, endDate)) {
    return STATEMENT_PERIOD_TOO_LONG_MESSAGE
  }

  return null
}

export function isStatementPeriodInvalid(
  startDate: string,
  endDate: string,
  reference = new Date(),
): boolean {
  return getStatementPeriodError(startDate, endDate, reference) !== null
}

export function normalizeStatementDateRange(startDate: string, endDate: string): [string, string] {
  const rangeStart = startDate.includes("T") ? startDate : `${startDate}T00:00:00.000`
  const rangeEnd = endDate.includes("T") ? endDate : `${endDate}T23:59:59.999`
  return [rangeStart, rangeEnd]
}
