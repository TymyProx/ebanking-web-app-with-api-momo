/**
 * Service de génération de PDF standardisé pour tous les documents BNG
 * 
 * Ce service garantit une mise en page uniforme pour tous les PDF générés :
 * - Barre verticale verte/jaune à gauche
 * - Logo en haut à droite
 * - Titre du document à gauche
 * - Footer avec informations de la banque à gauche
 * - Contenu dynamique selon le type de document
 */

import jsPDF from "jspdf"

// Couleurs BNG
const COLORS = {
  primaryGreen: [11, 132, 56] as [number, number, number],      // Vert BNG principal #0B8338
  primaryGreenDark: [8, 96, 41] as [number, number, number],  // Vert BNG foncé
  brandYellowSoft: [244, 230, 120] as [number, number, number], // Jaune BNG doux
  blackText: [15, 23, 42] as [number, number, number],        // Noir texte
  grayText: [100, 116, 139] as [number, number, number],      // Gris texte
  borderGray: [226, 232, 240] as [number, number, number],     // Gris bordure
  white: [255, 255, 255] as [number, number, number],         // Blanc
}

// Dimensions de la page (A4 en mm)
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_LEFT = 15
const CONTENT_RIGHT = PAGE_WIDTH - 15
const VERTICAL_STRIPE_WIDTH = 8
const VERTICAL_STRIPE_YELLOW_HEIGHT = 10

// Informations de la banque pour le footer
const BANK_INFO = {
  name: "Banque Nationale de Guinée SA",
  approval: "Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
  capital: "60.000.000.000 GNF",
  address: "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
  contact: "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
}

export interface PDFContentOptions {
  title: string
  subtitle?: string
  drawContent: (doc: jsPDF, y: number) => number // Fonction qui dessine le contenu et retourne la nouvelle position Y
}

export interface PDFGeneratorOptions {
  title: string
  subtitle?: string
  includeLogo?: boolean
  logoPath?: string
  logoDataUrl?: string // Pour les server actions, passer directement le data URL
}

/**
 * Génère un PDF avec le template standardisé BNG
 */
export async function generateStandardizedPDF(
  content: PDFContentOptions,
  options: PDFGeneratorOptions = { title: "Document BNG" }
): Promise<jsPDF> {
  const doc = new jsPDF()
  
  // Charger le logo de manière asynchrone si nécessaire
  let logoImage: HTMLImageElement | null = null
  let logoDataUrl: string | null = null
  
  if (options.includeLogo) {
    if (options.logoDataUrl) {
      // Utiliser le data URL fourni (pour server actions)
      logoDataUrl = options.logoDataUrl
      try {
        logoImage = await loadImageFromDataUrl(options.logoDataUrl)
      } catch (error) {
        console.warn("Erreur lors du chargement du logo depuis data URL:", error)
      }
    } else if (options.logoPath) {
      // Charger depuis un chemin (pour client-side)
      try {
        logoImage = await loadImage(options.logoPath)
      } catch (error) {
        console.warn("Logo non trouvé, génération sans logo:", error)
      }
    }
  }
  
  // Fonction pour dessiner le layout standardisé sur chaque page
  const drawStandardLayout = (pageNum: number, totalPages: number, isFirstPage: boolean = false) => {
    // Barre verticale verte à gauche (sur toute la hauteur de la page)
    doc.setFillColor(...COLORS.primaryGreen)
    doc.rect(0, 0, VERTICAL_STRIPE_WIDTH, PAGE_HEIGHT, "F")
    
    // Accent jaune au top de la barre (par-dessus le vert)
    doc.setFillColor(...COLORS.brandYellowSoft)
    doc.rect(0, 0, VERTICAL_STRIPE_WIDTH, VERTICAL_STRIPE_YELLOW_HEIGHT, "F")
    
    // Header blanc (seulement à droite de la barre, pas sur la barre)
    const headerHeight = isFirstPage ? 34 : 24
    doc.setFillColor(...COLORS.white)
    doc.rect(VERTICAL_STRIPE_WIDTH, 0, PAGE_WIDTH - VERTICAL_STRIPE_WIDTH, headerHeight, "F")
    
    // Titre du document
    if (isFirstPage) {
      // Page 1 : Titre complet avec sous-titre
      doc.setTextColor(...COLORS.blackText)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text(options.title, CONTENT_LEFT, 18)
      
      // Sous-titre (période, etc.) - uniquement sur la première page
      if (options.subtitle) {
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.grayText)
        doc.setFont("helvetica", "normal")
        doc.text(options.subtitle, CONTENT_LEFT, 26)
      }
      
      // Logo à droite (optionnel) - uniquement sur la première page
      if (logoImage) {
        try {
          doc.addImage(logoImage, "PNG", CONTENT_RIGHT - 32, 10, 30, 12)
        } catch (error) {
          console.warn("Erreur lors de l'ajout du logo:", error)
        }
      } else if (logoDataUrl) {
        // Utiliser le data URL directement si l'image n'a pas pu être chargée
        try {
          doc.addImage(logoDataUrl, "PNG", CONTENT_RIGHT - 32, 10, 30, 12)
        } catch (error) {
          console.warn("Erreur lors de l'ajout du logo depuis data URL:", error)
        }
      }
      
      // Ligne verte sous le header
      doc.setDrawColor(...COLORS.primaryGreen)
      doc.setLineWidth(1.2)
      doc.line(CONTENT_LEFT, 31, CONTENT_RIGHT, 31)
    } else {
      // Pages suivantes : Header compact avec juste le titre
      doc.setFontSize(12)
      doc.setTextColor(...COLORS.blackText)
      doc.setFont("helvetica", "bold")
      doc.text(options.title, CONTENT_LEFT, 12)
      
      // Ligne verte sous le header compact
      doc.setDrawColor(...COLORS.primaryGreen)
      doc.setLineWidth(1.0)
      doc.line(CONTENT_LEFT, 20, CONTENT_RIGHT, 20)
    }
    
    // Footer
    const footerY = PAGE_HEIGHT - 18
    
    // Ligne de séparation footer
    doc.setDrawColor(...COLORS.borderGray)
    doc.setLineWidth(0.4)
    doc.line(CONTENT_LEFT, footerY, CONTENT_RIGHT, footerY)
    
    // Texte du footer
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.grayText)
    doc.setFont("helvetica", "normal")
    
    const footerLines = [
      `${BANK_INFO.name} - ${BANK_INFO.approval}`,
      `Capital : ${BANK_INFO.capital}`,
      BANK_INFO.address,
      BANK_INFO.contact,
    ]
    
    let y = footerY + 4
    footerLines.forEach((line) => {
      doc.text(line, CONTENT_LEFT, y)
      y += 3
    })
    
    // Numéro de page
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.primaryGreenDark)
    doc.setFont("helvetica", "bold")
    doc.text(`Page ${pageNum} / ${totalPages}`, CONTENT_RIGHT, footerY + 4, { align: "right" })
  }
  
  // Intercepter l'ajout de nouvelles pages pour dessiner le layout automatiquement
  const originalAddPage = doc.addPage.bind(doc)
  doc.addPage = function(options?: any) {
    const result = originalAddPage.call(this, options)
    // Dessiner le layout sur la nouvelle page (avec numéro temporaire)
    const currentPage = this.getNumberOfPages()
    drawStandardLayout(currentPage, currentPage, false)
    // Positionner le curseur après le header compact
    this.y = 30
    return result
  }
  
  // Dessiner le layout sur la première page
  drawStandardLayout(1, 1, true)
  
  // Position de départ pour le contenu (première page)
  let y = 50
  
  // Dessiner le contenu
  y = content.drawContent(doc, y)
  
  // Redessiner le layout complet sur toutes les pages avec le bon nombre total de pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 0; i < totalPages; i++) {
    doc.setPage(i + 1)
    const isFirstPage = i === 0
    drawStandardLayout(i + 1, totalPages, isFirstPage)
  }
  
  return doc
}

/**
 * Ajoute le logo au PDF (à appeler après la génération du contenu)
 */
export function addLogoToPDF(doc: jsPDF, logoImage: HTMLImageElement) {
  const totalPages = doc.getNumberOfPages()
  if (totalPages > 0) {
    doc.setPage(1)
    doc.addImage(logoImage, "PNG", CONTENT_RIGHT - 32, 10, 30, 12)
  }
}

/**
 * Charge une image de manière asynchrone
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Charge une image depuis un data URL
 */
function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Utilitaires pour formater les montants
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Utilitaires pour formater les dates
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("fr-FR")
}

/**
 * Utilitaires pour formater les dates avec heure
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("fr-FR")
}

/**
 * Exporte un PDF en fichier
 */
export function savePDF(doc: jsPDF, fileName: string) {
  doc.save(fileName)
}
