"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ArrowRightLeft,
  Banknote,
  Shield,
  Settings,
  FileText,
} from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories = [
    { id: "all", name: "Toutes les catégories", icon: HelpCircle },
    { id: "compte", name: "Comptes", icon: CreditCard },
    { id: "virements", name: "Virements", icon: ArrowRightLeft },
    { id: "paiements", name: "Paiements", icon: Banknote },
    { id: "securite", name: "Sécurité", icon: Shield },
    { id: "technique", name: "Technique", icon: Settings },
    { id: "documents", name: "Documents", icon: FileText },
  ]

  const faqs: FAQItem[] = [
    {
      id: "1",
      question: "Comment consulter le solde de mon compte ?",
      answer:
        "Vous pouvez consulter le solde de votre compte en vous connectant à votre espace client et en accédant à la section 'Comptes > Soldes'. Le solde est mis à jour en temps réel.",
      category: "compte",
      tags: ["solde", "consultation", "compte"],
    },
    {
      id: "2",
      question: "Comment effectuer un virement ?",
      answer:
        "Pour effectuer un virement, rendez-vous dans la section 'Virements > Nouveau virement'. Saisissez les informations du bénéficiaire, le montant et validez avec votre code de sécurité.",
      category: "virements",
      tags: ["virement", "transfert", "bénéficiaire"],
    },
    {
      id: "3",
      question: "Quels sont les frais de virement ?",
      answer:
        "Les frais de virement varient selon le type : virement interne (gratuit), virement national (500 GNF), virement international (2% du montant, minimum 5000 GNF).",
      category: "virements",
      tags: ["frais", "tarifs", "virement"],
    },
    {
      id: "4",
      question: "Comment sécuriser mon compte ?",
      answer:
        "Pour sécuriser votre compte : utilisez un mot de passe fort, activez la double authentification, ne partagez jamais vos codes, et déconnectez-vous après chaque session.",
      category: "securite",
      tags: ["sécurité", "mot de passe", "authentification"],
    },
    {
      id: "5",
      question: "Comment télécharger un RIB ?",
      answer:
        "Vous pouvez télécharger votre RIB depuis la section 'E-Services > RIB'. Le document est généré instantanément au format PDF.",
      category: "documents",
      tags: ["RIB", "téléchargement", "document"],
    },
    {
      id: "6",
      question: "Que faire en cas de carte perdue ou volée ?",
      answer:
        "En cas de perte ou vol de votre carte, contactez immédiatement notre service client au +224 123 456 789 pour faire opposition. Vous pouvez aussi le faire depuis votre espace client.",
      category: "securite",
      tags: ["carte", "opposition", "vol", "perte"],
    },
    {
      id: "7",
      question: "Comment payer mes factures en ligne ?",
      answer:
        "Rendez-vous dans 'Paiements > Factures', sélectionnez votre fournisseur, saisissez votre référence client et le montant, puis validez le paiement.",
      category: "paiements",
      tags: ["factures", "paiement", "fournisseur"],
    },
    {
      id: "8",
      question: "L'application ne fonctionne pas, que faire ?",
      answer:
        "Vérifiez votre connexion internet, fermez et relancez l'application. Si le problème persiste, videz le cache ou contactez notre support technique.",
      category: "technique",
      tags: ["application", "bug", "technique"],
    },
  ]

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Centre d'aide</h1>
          <p className="text-lg text-gray-600 mb-6">
            Trouvez rapidement les réponses à vos questions ou contactez notre équipe support
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catégories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <a href="/support/chat" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Live Chat
                  </a>
                </Button>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">+224 123 456 789</p>
                      <p className="text-gray-500">Service client</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">support@astrabank.gn</p>
                      <p className="text-gray-500">Email support</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="font-medium">8h - 18h</p>
                      <p className="text-gray-500">Lun - Ven</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - FAQs */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Questions fréquentes</span>
                  <Badge variant="secondary">
                    {filteredFAQs.length} résultat{filteredFAQs.length > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {selectedCategory !== "all" && (
                    <span>Catégorie : {categories.find((c) => c.id === selectedCategory)?.name}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
                    <p className="text-gray-600 mb-4">Essayez avec d'autres mots-clés ou contactez notre support</p>
                    <Button asChild>
                      <a href="/support/chat">Contacter le support</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="border rounded-lg">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 pr-4">{faq.question}</h3>
                          {expandedFAQ === faq.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>

                        {expandedFAQ === faq.id && (
                          <div className="px-4 pb-4">
                            <div className="pt-2 border-t">
                              <p className="text-gray-700 mb-3">{faq.answer}</p>
                              <div className="flex flex-wrap gap-2">
                                {faq.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Chat en direct</h3>
                      <p className="text-sm text-gray-600">Assistance immédiate</p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <a href="/support/chat">Démarrer une conversation</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-medium">Réclamations</h3>
                      <p className="text-sm text-gray-600">Signaler un problème</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
                    <a href="/complaints">Soumettre une réclamation</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
