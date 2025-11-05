import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return email

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`
  }

  const visibleStart = localPart.slice(0, 2)
  const maskedPart = "*".repeat(Math.min(localPart.length - 2, 6))

  return `${visibleStart}${maskedPart}@${domain}`
}
