"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, Plus, Eye, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { getInvestments } from "./new/actions"

interface Investment {
  id: string
  reference: string
  investorName: string
  investmentType: string
  amount: string
  duration: string
  status: string
  createdAt: Date
  estimatedReturn: number
}

const INVESTMENT_TYPE_LABELS = {
  actions: "Actions",
  obligations: "Obligations",
  fonds_communs: "Fonds communs",
  epargne_terme: "Épargne à terme",
}

const STATUS_LABELS = {
  en_attente_validation: "En attente",
  valide: "Validé",
  en_cours: "En cours",
  echu: "Échu",
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        const data = await getInvestments()
        setInvestments(data)
      } catch (error) {
        console.error("Erreur lors du chargement des placements:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInvestments()
  }, [])

  const totalInvested = investments.reduce((sum, inv) => sum + Number.parseFloat(inv.amount), 0)
  const totalReturn = investments.reduce((sum, inv) => sum + inv.estimatedReturn, 0)

  if (loading) {
    return <div>Chargement des placements...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mes Placements
          </h1>
          <p className="text-sm text-muted-foreground">Gérez vos investissements financiers</p>
        </div>
        <Link href="/investments/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Placement
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Capital investi</p>
                <p className="text-2xl font-bold">{totalInvested.toLocaleString("fr-FR")} GNF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rendement estimé</p>
                <p className="text-2xl font-bold text-green-600">{totalReturn.toLocaleString("fr-FR")} GNF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Placements actifs</p>
                <p className="text-2xl font-bold">{investments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold">
                  {investments.filter((inv) => inv.status === "en_attente_validation").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des placements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Placements</CardTitle>
          <CardDescription>Suivez l'évolution de tous vos investissements</CardDescription>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez pas encore effectué de placement.
                <Link href="/investments/new" className="font-medium text-blue-600 hover:underline ml-1">
                  Créer votre premier placement
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Rendement estimé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">{investment.reference}</TableCell>
                    <TableCell>
                      {INVESTMENT_TYPE_LABELS[investment.investmentType as keyof typeof INVESTMENT_TYPE_LABELS]}
                    </TableCell>
                    <TableCell>{Number.parseFloat(investment.amount).toLocaleString("fr-FR")} GNF</TableCell>
                    <TableCell>{investment.duration} mois</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      +{investment.estimatedReturn.toLocaleString("fr-FR")} GNF
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          investment.status === "valide"
                            ? "default"
                            : investment.status === "en_cours"
                              ? "secondary"
                              : investment.status === "echu"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {STATUS_LABELS[investment.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(investment.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
