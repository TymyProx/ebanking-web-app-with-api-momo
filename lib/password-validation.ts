export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Minimum 8 caractères
  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères")
  }

  // Au moins une majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule")
  }

  // Au moins un chiffre
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre")
  }

  // Au moins un symbole
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'`~]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un symbole (!@#$%^&*...)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function getPasswordRequirements(): string[] {
  return ["Minimum 8 caractères", "Au moins une majuscule", "Au moins un chiffre", "Au moins un symbole (!@#$%^&*...)"]
}
