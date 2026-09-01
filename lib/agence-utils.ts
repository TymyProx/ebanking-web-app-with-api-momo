export const AGENCE_DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

export type AgenceDayKey = (typeof AGENCE_DAY_ORDER)[number]

export function sortOpeningHoursEntries(
  openingHours: Record<string, { open?: string; close?: string; closed?: boolean }> | undefined,
): Array<[string, { open?: string; close?: string; closed?: boolean }]> {
  if (!openingHours) return []

  const entries = Object.entries(openingHours)
  return entries.sort(([dayA], [dayB]) => {
    const indexA = AGENCE_DAY_ORDER.indexOf(dayA as AgenceDayKey)
    const indexB = AGENCE_DAY_ORDER.indexOf(dayB as AgenceDayKey)
    const rankA = indexA === -1 ? AGENCE_DAY_ORDER.length : indexA
    const rankB = indexB === -1 ? AGENCE_DAY_ORDER.length : indexB
    return rankA - rankB
  })
}

export function getAgenceDayLabel(key: string): string {
  const labels: Record<string, string> = {
    mon: "Lundi",
    tue: "Mardi",
    wed: "Mercredi",
    thu: "Jeudi",
    fri: "Vendredi",
    sat: "Samedi",
    sun: "Dimanche",
  }
  return labels[key] || key
}
