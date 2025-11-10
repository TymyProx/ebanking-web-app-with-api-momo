"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { addExpense, exportExpenses, updateBudgetSettings } from "./actions"
import { useActionState } from "react"

// Icônes SVG inline
const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573 1.066c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const AlertCircleIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const AlertTriangleIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
    />
  </svg>
)

// Catégories de dépenses prédéfinies
const EXPENSE_CATEGORIES = [
  { value: "logement", label: "🏠 Logement", color: "#45B7D1" },
  { value: "alimentation", label: "🍽️ Alimentation", color: "#FF6B6B" },
  { value: "transport", label: "🚗 Transport", color: "#4ECDC4" },
  { value: "sante", label: "🏥 Santé", color: "#96CEB4" },
  { value: "loisirs", label: "🎮 Loisirs", color: "#FFEAA7" },
  { value: "education", label: "📚 Éducation", color: "#DDA0DD" },
  { value: "abonnements", label: "📱 Abonnements", color: "#98D8C8" },
  { value: "shopping", label: "🛍️ Shopping", color: "#F7DC6F" },
  { value: "autres", label: "📦 Autres", color: "#BDC3C7" },
]

// Comptes disponibles
const ACCOUNTS = [
  { value: "0001-234567-89", label: "Compte Courant - 0001-234567-89" },
  { value: "0002-345678-90", label: "Compte Épargne - 0002-345678-90" },
  { value: "0003-456789-01", label: "Compte USD - 0003-456789-01" },
]

export default function BudgetPage() {
  const [state, formAction, isPending] = useActionState(addExpense, null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [budgetData, setBudgetData] = useState({
    monthlyIncome: 2500000,
    monthlyBudget: 2000000,
    totalExpenses: 1800000,
    budgetUsagePercent: 90,
    remainingBudget: 200000,
    isOverBudget: false,
    overBudgetPercent: 0,
  })
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPeriod, setFilterPeriod] = useState("month")

  // Données simulées pour les graphiques
  useEffect(() => {
    // Simulation des données de dépenses par catégorie
    const mockCategoryData = [
      { name: "Logement", value: 800000, color: "#45B7D1", budget: 900000 },
      { name: "Alimentation", value: 450000, color: "#FF6B6B", budget: 400000 },
      { name: "Transport", value: 220000, color: "#4ECDC4", budget: 250000 },
      { name: "Santé", value: 75000, color: "#96CEB4", budget: 100000 },
      { name: "Loisirs", value: 155000, color: "#FFEAA7", budget: 200000 },
      { name: "Autres", value: 100000, color: "#BDC3C7", budget: 150000 },
    ]

    // Simulation des données mensuelles (budget vs dépenses)
    const mockMonthlyData = [
      { month: "Jan", budget: 2000000, expenses: 1850000 },
      { month: "Fév", budget: 2000000, expenses: 1920000 },
      { month: "Mar", budget: 2000000, expenses: 1750000 },
      { month: "Avr", budget: 2000000, expenses: 2100000 },
      { month: "Mai", budget: 2000000, expenses: 1980000 },
      { month: "Juin", budget: 2000000, expenses: 1800000 },
    ]

    // Simulation des dépenses récentes
    const mockExpenses = [
      {
        id: 1,
        date: "2024-01-15",
        category: "alimentation",
        amount: 25000,
        description: "Supermarché Kaloum",
        account: "0001-234567-89",
      },
      {
        id: 2,
        date: "2024-01-14",
        category: "transport",
        amount: 15000,
        description: "Taxi vers Kipé",
        account: "0001-234567-89",
      },
      {
        id: 3,
        date: "2024-01-13",
        category: "sante",
        amount: 50000,
        description: "Consultation médicale",
        account: "0001-234567-89",
      },
      {
        id: 4,
        date: "2024-01-12",
        category: "loisirs",
        amount: 35000,
        description: "Cinéma Rogbané",
        account: "0001-234567-89",
      },
      {
        id: 5,
        date: "2024-01-11",
        category: "abonnements",
        amount: 45000,
        description: "Internet Orange",
        account: "0001-234567-89",
      },
    ]

    setCategoryData(mockCategoryData)
    setMonthlyData(mockMonthlyData)
    setExpenses(mockExpenses)

    // Calcul des données budgétaires
    const totalExpenses = mockCategoryData.reduce((sum, item) => sum + item.value, 0)
    const monthlyBudget = 2000000
    const budgetUsagePercent = Math.round((totalExpenses / monthlyBudget) * 100)
    const isOverBudget = totalExpenses > monthlyBudget
    const overBudgetPercent = isOverBudget ? Math.round(((totalExpenses - monthlyBudget) / monthlyBudget) * 100) : 0

    setBudgetData({
      monthlyIncome: 2500000,
      monthlyBudget,
      totalExpenses,
      budgetUsagePercent,
      remainingBudget: monthlyBudget - totalExpenses,
      isOverBudget,
      overBudgetPercent,
    })
  }, [])

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((cat) => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getCategoryColor = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((cat) => cat.value === categoryValue)
    return category ? category.color : "#BDC3C7"
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (filterCategory !== "all" && expense.category !== filterCategory) {
      return false
    }
    return true
  })

  const handleExport = async (format: string) => {
    try {
      await exportExpenses(format, filterCategory, filterPeriod)
      alert(`Export ${format.toUpperCase()} en cours de téléchargement...`)
    } catch (error) {
      alert("Erreur lors de l'export")
    }
  }

  const handleBudgetUpdate = async (formData: FormData) => {
    try {
      const result = await updateBudgetSettings(formData)
      if (result.success) {
        setBudgetData((prev) => ({
          ...prev,
          monthlyIncome: result.data.monthlyIncome,
          monthlyBudget: result.data.monthlyBudget,
        }))
        setIsSettingsOpen(false)
        alert("✅ Votre budget a été mis à jour avec succès.")
      }
    } catch (error) {
      alert("Erreur lors de la mise à jour du budget")
    }
  }

  useEffect(() => {
    if (state?.success) {
      setIsDialogOpen(false)
      // Recharger les données
      window.location.reload()
    }
  }, [state])

  const getBudgetStatusColor = () => {
    if (budgetData.isOverBudget) return "text-red-600"
    if (budgetData.budgetUsagePercent > 80) return "text-orange-600"
    return "text-green-600"
  }

  const getBudgetProgressColor = () => {
    if (budgetData.isOverBudget) return "bg-red-500"
    if (budgetData.budgetUsagePercent > 80) return "bg-orange-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestion budgétaire
          </h1>
          <p className="text-sm text-muted-foreground">Suivez vos revenus, dépenses et objectifs budgétaires</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <SettingsIcon />
                <span className="ml-2">Paramètres</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Paramètres budgétaires</DialogTitle>
              </DialogHeader>
              <form action={handleBudgetUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="monthlyIncome">Revenu mensuel (GNF)</Label>
                  <Input
                    id="monthlyIncome"
                    name="monthlyIncome"
                    type="number"
                    min="0"
                    defaultValue={budgetData.monthlyIncome}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyBudget">Objectif de dépense mensuel (GNF)</Label>
                  <Input
                    id="monthlyBudget"
                    name="monthlyBudget"
                    type="number"
                    min="0"
                    defaultValue={budgetData.monthlyBudget}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Plafond à ne pas dépasser</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Sauvegarder</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon />
                <span className="ml-2">Ajouter une dépense</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouvelle dépense</DialogTitle>
              </DialogHeader>
              <form action={formAction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input id="fullName" name="fullName" defaultValue="Mamadou Diallo" required />
                  </div>
                  <div>
                    <Label htmlFor="account">Compte bancaire</Label>
                    <Select name="account" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNTS.map((account) => (
                          <SelectItem key={account.value} value={account.value}>
                            {account.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue="mamadou.diallo@example.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" defaultValue="+224 123 456 789" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Montant (GNF)</Label>
                    <Input id="amount" name="amount" type="number" min="1" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date de dépense</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <CalendarIcon />
                          {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <input type="hidden" name="date" value={selectedDate?.toISOString()} />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="Description de la dépense" required />
                  </div>
                </div>

                {state?.error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}

                {state?.success && (
                  <Alert>
                    <AlertDescription className="text-green-600">
                      ✅ Votre dépense a bien été enregistrée et catégorisée. Votre budget a été mis à jour.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertes budgétaires */}
      {budgetData.isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription>
            ⚠️ Attention : vous avez dépassé votre budget mensuel de {budgetData.overBudgetPercent}%. Dépenses actuelles
            : {formatAmount(budgetData.totalExpenses)} GNF sur {formatAmount(budgetData.monthlyBudget)} GNF.
          </AlertDescription>
        </Alert>
      )}

      {budgetData.budgetUsagePercent > 80 && !budgetData.isOverBudget && (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            ⚠️ Vous approchez de votre limite budgétaire ({budgetData.budgetUsagePercent}% utilisé). Il vous reste{" "}
            {formatAmount(budgetData.remainingBudget)} GNF pour ce mois.
          </AlertDescription>
        </Alert>
      )}

      {/* Résumé budgétaire */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu mensuel</CardTitle>
            <TrendingUpIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(budgetData.monthlyIncome)} GNF</div>
            <p className="text-sm text-muted-foreground">Revenus du mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget mensuel</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(budgetData.monthlyBudget)} GNF</div>
            <p className="text-sm text-muted-foreground">Objectif fixé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses actuelles</CardTitle>
            <div className="text-2xl">💸</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBudgetStatusColor()}`}>
              {formatAmount(budgetData.totalExpenses)} GNF
            </div>
            <p className="text-sm text-muted-foreground">{budgetData.budgetUsagePercent}% du budget utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {budgetData.isOverBudget ? "Dépassement" : "Budget restant"}
            </CardTitle>
            <div className="text-2xl">{budgetData.isOverBudget ? "⚠️" : "💰"}</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetData.isOverBudget ? "text-red-600" : "text-green-600"}`}>
              {formatAmount(Math.abs(budgetData.remainingBudget))} GNF
            </div>
            <p className="text-sm text-muted-foreground">
              {budgetData.isOverBudget ? "Au-dessus du budget" : "Disponible ce mois"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jauge de progression budgétaire */}
      <Card>
        <CardHeader>
          <CardTitle>Progression budgétaire mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisé: {formatAmount(budgetData.totalExpenses)} GNF</span>
              <span>Budget: {formatAmount(budgetData.monthlyBudget)} GNF</span>
            </div>
            <Progress
              value={Math.min(budgetData.budgetUsagePercent, 100)}
              className="h-3"
              style={{
                background: budgetData.isOverBudget
                  ? "#fee2e2"
                  : budgetData.budgetUsagePercent > 80
                    ? "#fef3c7"
                    : "#f0fdf4",
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className={getBudgetStatusColor()}>{budgetData.budgetUsagePercent}%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="categories">Par catégories</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique Budget vs Dépenses */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Dépenses par mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    budget: {
                      label: "Budget",
                      color: "#8884d8",
                    },
                    expenses: {
                      label: "Dépenses",
                      color: "#82ca9d",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded shadow">
                                <p className="font-medium">{label}</p>
                                <p className="text-sm text-blue-600">
                                  Budget: {formatAmount(payload[0]?.value || 0)} GNF
                                </p>
                                <p className="text-sm text-green-600">
                                  Dépenses: {formatAmount(payload[1]?.value || 0)} GNF
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                      <Bar dataKey="expenses" fill="#82ca9d" name="Dépenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Répartition par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Montant",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white p-2 border rounded shadow">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm">Dépensé: {formatAmount(data.value)} GNF</p>
                                <p className="text-sm">Budget: {formatAmount(data.budget)} GNF</p>
                                <p className="text-xs text-gray-500">
                                  {data.value > data.budget ? "⚠️ Dépassé" : "✅ Dans le budget"}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dépenses par catégorie vs Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category) => {
                  const usagePercent = Math.round((category.value / category.budget) * 100)
                  const isOverBudget = category.value > category.budget
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isOverBudget ? "text-red-600" : "text-gray-900"}`}>
                            {formatAmount(category.value)} GNF
                          </div>
                          <div className="text-xs text-gray-500">sur {formatAmount(category.budget)} GNF</div>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(usagePercent, 100)}
                        className="h-2"
                        style={{
                          background: isOverBudget ? "#fee2e2" : usagePercent > 80 ? "#fef3c7" : "#f0fdf4",
                        }}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={isOverBudget ? "text-red-600" : "text-gray-600"}>{usagePercent}%</span>
                        {isOverBudget && <span className="text-red-600">Dépassé de {usagePercent - 100}%</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      />
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryLabel(expense.category)} • {expense.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-{formatAmount(expense.amount)} GNF</p>
                      <p className="text-sm text-muted-foreground">{expense.account}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports budgétaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => handleExport("pdf")} variant="outline">
                  <DownloadIcon />
                  <span className="ml-2">Rapport PDF</span>
                </Button>
                <Button onClick={() => handleExport("csv")} variant="outline">
                  <DownloadIcon />
                  <span className="ml-2">Export CSV</span>
                </Button>
                <Button onClick={() => handleExport("excel")} variant="outline">
                  <DownloadIcon />
                  <span className="ml-2">Export Excel</span>
                </Button>
              </div>

              <Alert>
                <AlertCircleIcon />
                <AlertDescription>
                  Les rapports incluent l'analyse complète de votre budget : revenus, dépenses par catégorie, évolution
                  mensuelle et recommandations.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Résumé budgétaire du mois</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Revenus:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatAmount(budgetData.monthlyIncome)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget fixé:</span>
                    <span className="ml-2 font-medium">{formatAmount(budgetData.monthlyBudget)} GNF</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total dépensé:</span>
                    <span className={`ml-2 font-medium ${getBudgetStatusColor()}`}>
                      {formatAmount(budgetData.totalExpenses)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taux d'utilisation:</span>
                    <span className={`ml-2 font-medium ${getBudgetStatusColor()}`}>
                      {budgetData.budgetUsagePercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Épargne potentielle:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {formatAmount(budgetData.monthlyIncome - budgetData.totalExpenses)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>
                    <span className={`ml-2 font-medium ${getBudgetStatusColor()}`}>
                      {budgetData.isOverBudget
                        ? `Dépassé de ${budgetData.overBudgetPercent}%`
                        : `${formatAmount(budgetData.remainingBudget)} GNF restant`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
