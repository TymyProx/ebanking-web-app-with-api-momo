import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation des données requises
    const { accountId, cardType, deliveryMethod, phone, email } = body

    if (!accountId || !cardType || !deliveryMethod || !phone || !email) {
      return NextResponse.json({ message: "Tous les champs obligatoires doivent être remplis" }, { status: 400 })
    }

    // Validation du mode de livraison
    if (deliveryMethod === "delivery" && !body.deliveryAddress) {
      return NextResponse.json(
        { message: "L'adresse de livraison est requise pour la livraison à domicile" },
        { status: 400 },
      )
    }

    if (deliveryMethod === "pickup" && !body.pickupAgency) {
      return NextResponse.json(
        { message: "L'agence de retrait est requise pour le retrait en agence" },
        { status: 400 },
      )
    }

    // Simulation de l'enregistrement de la demande
    // En réalité, ici on sauvegarderait en base de données
    const cardRequest = {
      id: `REQ-${Date.now()}`,
      accountId,
      cardType,
      deliveryMethod,
      deliveryAddress: body.deliveryAddress || null,
      pickupAgency: body.pickupAgency || null,
      phone,
      email,
      comments: body.comments || "",
      status: "pending",
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
    }

    // Simulation d'envoi de notifications
    console.log("Demande de carte enregistrée:", cardRequest)
    console.log("Envoi SMS à:", phone)
    console.log("Envoi email à:", email)

    return NextResponse.json({
      success: true,
      message: "Votre demande d'ouverture de compte a été prise en compte",
      requestId: cardRequest.id,
      estimatedDelivery: cardRequest.estimatedDelivery,
    })
  } catch (error) {
    console.error("Erreur lors de la demande de carte:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
