"use server"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  postalCode: string
  country: string
  profession: string
  employer: string
  monthlyIncome: string
}

export async function updateProfile(data: ProfileData) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulate occasional server error (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      message: "Erreur de connexion au serveur. Veuillez réessayer.",
    }
  }

  // Validate required fields
  const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "country"]
  for (const field of requiredFields) {
    if (!data[field as keyof ProfileData]?.trim()) {
      return {
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      }
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return {
      success: false,
      message: "Format d'email invalide",
    }
  }

  // Simulate successful update
  console.log("Profile updated:", data)

  return {
    success: true,
    message: "Informations mises à jour avec succès",
  }
}
