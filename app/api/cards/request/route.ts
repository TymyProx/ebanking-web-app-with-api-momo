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

    // Simulation de l'appel à l'API externe
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.1.200:8080/api"

    const requestData = {
      accountId: body.accountId,
      cardType: body.cardType,
      deliveryMethod: body.deliveryMethod,
      deliveryAddress: body.deliveryAddress || null,
      pickupAgency: body.pickupAgency || null,
      phone: body.phone,
      email: body.email,
      comments: body.comments || "",
      requestDate: new Date().toISOString(),
      status: "PENDING",
    }

    // Ici, vous feriez l'appel réel à votre API backend
    // const response = await fetch(`${apiBaseUrl}/cards/request`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": request.headers.get("Authorization") || ""
    //   },
    //   body: JSON.stringify(requestData)
    // })

    // Pour la démonstration, on simule une réponse réussie
    console.log("[v0] Card request data:", requestData)

    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Votre demande de carte bancaire a été soumise avec succès",
      requestId: `CARD_REQ_${Date.now()}`,
      estimatedDelivery: "5-7 jours ouvrables",
    })
  } catch (error) {
    console.error("Erreur lors de la demande de carte:", error)
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 })
  }
}
