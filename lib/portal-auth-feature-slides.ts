import { navigationData } from "@/lib/portal-navigation-data"

export type PortalAuthFeatureSlide = {
  title: string
  description: string
}

const DESCRIPTION_BY_TITLE: Partial<Record<string, string>> = {
  Dashboard: "Visualisez l’ensemble de vos comptes, soldes et activités récentes.",
  "Consultation de solde": "Consultez le solde de vos comptes à tout moment.",
  "Relevé de coordonnées bancaires": "Téléchargez et partagez vos coordonnées bancaires (RIB) en toute sécurité.",
  "Relevés bancaires": "Consultez et téléchargez vos relevés d’opérations.",
  "Effectuer un virement": "Réalisez des virements vers vos comptes ou vos bénéficiaires enregistrés.",
  Bénéficiaires: "Gérez votre carnet de bénéficiaires pour des virements plus rapides.",
  "Mes virements": "Suivez l’historique et le statut de vos virements.",
  Réclamations: "Déposez et suivez vos demandes auprès de la banque.",
  Agences: "Localisez nos agences et leurs informations pratiques.",
  Notifications: "Restez informé grâce aux alertes et messages de votre espace.",
}

/**
 * Slides du carrousel login / auth : mêmes entrées que les liens utiles de la sidebar (compte actif).
 */
export function getPortalAuthFeatureSlides(): PortalAuthFeatureSlide[] {
  const slides: PortalAuthFeatureSlide[] = []

  for (const item of navigationData.main) {
    slides.push({
      title: item.title,
      description:
        DESCRIPTION_BY_TITLE[item.title] ??
        (item.description
          ? `${item.description} — disponible après connexion dans votre espace.`
          : `Fonctionnalité « ${item.title} » disponible dans votre espace client.`),
    })
  }

  for (const group of navigationData.accounts) {
    for (const sub of group.items) {
      slides.push({
        title: sub.title,
        description:
          DESCRIPTION_BY_TITLE[sub.title] ??
          `Raccourci menu Comptes — ${sub.title.toLowerCase()}, accessible après connexion.`,
      })
    }
  }

  for (const op of navigationData.operations) {
    if (op.items) {
      for (const sub of op.items) {
        slides.push({
          title: sub.title,
          description:
            DESCRIPTION_BY_TITLE[sub.title] ??
            `Raccourci menu Opérations — ${sub.title.toLowerCase()}, accessible après connexion.`,
        })
      }
    } else if (op.url) {
      slides.push({
        title: op.title,
        description:
          DESCRIPTION_BY_TITLE[op.title] ??
          `Fonctionnalité « ${op.title} » disponible dans votre espace client.`,
      })
    }
  }

  for (const svc of navigationData.services) {
    for (const sub of svc.items) {
      slides.push({
        title: sub.title,
        description:
          DESCRIPTION_BY_TITLE[sub.title] ??
          `Raccourci E-Services — ${sub.title.toLowerCase()}, accessible après connexion.`,
      })
    }
  }

  for (const sup of navigationData.support) {
    if (sup.items) {
      for (const sub of sup.items) {
        slides.push({
          title: sub.title,
          description:
            DESCRIPTION_BY_TITLE[sub.title] ??
            `Support — ${sub.title}, accessible depuis votre espace.`,
        })
      }
    } else if (sup.url) {
      slides.push({
        title: sup.title,
        description:
          DESCRIPTION_BY_TITLE[sup.title] ??
          `Fonctionnalité « ${sup.title} » disponible dans votre espace client.`,
      })
    }
  }

  return slides
}
