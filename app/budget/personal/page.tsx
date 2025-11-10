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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createPersonalBudget, addBudgetExpense, exportBudgetReport } from "./actions"
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
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

const PiggyBankIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

// Catégories de dépenses avec budgets suggérés
const EXPENSE_CATEGORIES = [
  { value: "logement", label: "🏠 Logement", color: "#3B82F6", suggestedPercent: 30 },
  { value: "alimentation", label: "🍽️ Alimentation", color: "#EF4444", suggestedPercent: 15 },
  { value: "transport", label: "🚗 Transport", color: "#10B981", suggestedPercent: 15 },
  { value: "sante", label: "🏥 Santé", color: "#8B5CF6", suggestedPercent: 8 },
  { value: "loisirs", label: "🎮 Loisirs", color: "#F59E0B", suggestedPercent: 10 },
  { value: "education", label: "📚 Éducation", color: "#EC4899", suggestedPercent: 5 },
  { value: "abonnements", label: "📱 Abonnements", color: "#06B6D4", suggestedPercent: 5 },
  { value: "shopping", label: "🛍️ Shopping", color: "#84CC16", suggestedPercent: 7 },
  { value: "epargne", label: "💰 Épargne", color: "#6366F1", suggestedPercent: 20 },
  { value: "autres", label: "📦 Autres", color: "#6B7280", suggestedPercent: 5 },
]

// Comptes disponibles
const ACCOUNTS = [
  { value: "0001-234567-89", label: "Compte Courant Principal - 0001-234567-89" },
  { value: "0002-345678-90", label: "Compte Épargne - 0002-345678-90" },
  { value: "0003-456789-01", label: "Compte USD - 0003-456789-01" },
]

export default function PersonalBudgetPage() {
  const [budgetState, budgetAction, isBudgetPending] = useActionState(createPersonalBudget, null)
  const [expenseState, expenseAction, isExpensePending] = useActionState(addBudgetExpense, null)

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [budgetData, setBudgetData] = useState({
    isConfigured: true,
    monthlyIncome: 3000000,
    monthlyBudget: 2400000,
    savingsGoal: 600000,
    totalExpenses: 2100000,
    totalSavings: 450000,
    budgetUsagePercent: 87.5,
    savingsPercent: 75,
    remainingBudget: 300000,
    isOverBudget: false,
    overBudgetAmount: 0,
  })

  const [categoryData, setCategoryData] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])

  // Chargement des données au montage du composant
  useEffect(() => {
    loadBudgetData()
  }, [])

  const loadBudgetData = async () => {
    try {
      // Simulation des données de catégories avec budgets vs dépenses
      const mockCategoryData = [
        { name: "Logement", value: 900000, budget: 900000, color: "#3B82F6", percent: 100 },
        { name: "Alimentation", value: 480000, budget: 450000, color: "#EF4444", percent: 107 },
        { name: "Transport", value: 320000, budget: 360000, color: "#10B981", percent: 89 },
        { name: "Santé", value: 120000, budget: 192000, color: "#8B5CF6", percent: 63 },
        { name: "Loisirs", value: 180000, budget: 240000, color: "#F59E0B", percent: 75 },
        { name: "Épargne", value: 450000, budget: 600000, color: "#6366F1", percent: 75 },
        { name: "Autres", value: 100000, budget: 120000, color: "#6B7280", percent: 83 },
      ]

      // Simulation de l'évolution mensuelle
      const mockMonthlyTrend = [
        { month: "Jan", budget: 2400000, expenses: 2200000, savings: 400000, income: 3000000 },
        { month: "Fév", budget: 2400000, expenses: 2350000, savings: 350000, income: 3000000 },
        { month: "Mar", budget: 2400000, expenses: 2100000, savings: 500000, income: 3000000 },
        { month: "Avr", budget: 2400000, expenses: 2450000, savings: 250000, income: 3000000 },
        { month: "Mai", budget: 2400000, expenses: 2300000, savings: 400000, income: 3000000 },
        { month: "Juin", budget: 2400000, expenses: 2100000, savings: 450000, income: 3000000 },
      ]

      // Simulation des dépenses récentes
      const mockRecentExpenses = [
        {
          id: 1,
          date: "2024-01-15",
          category: "alimentation",
          amount: 45000,
          description: "Supermarché Kaloum",
          account: "0001-234567-89",
          type: "manual",
        },
        {
          id: 2,
          date: "2024-01-14",
          category: "transport",
          amount: 25000,
          description: "Carburant Total",
          account: "0001-234567-89",
          type: "automatic",
        },
        {
          id: 3,
          date: "2024-01-13",
          category: "sante",
          amount: 75000,
          description: "Pharmacie Centrale",
          account: "0001-234567-89",
          type: "manual",
        },
        {
          id: 4,
          date: "2024-01-12",
          category: "loisirs",
          amount: 60000,
          description: "Restaurant Le Damier",
          account: "0001-234567-89",
          type: "automatic",
        },
        {
          id: 5,
          date: "2024-01-11",
          category: "abonnements",
          amount: 85000,
          description: "Internet Orange",
          account: "0001-234567-89",
          type: "automatic",
        },
      ]

      // Simulation des alertes budgétaires
      const mockAlerts = [
        {
          id: 1,
          type: "warning",
          category: "alimentation",
          message: "Vous avez dépassé votre budget Alimentation de 7%",
          amount: 30000,
          severity: "medium",
        },
        {
          id: 2,
          type: "info",
          category: "epargne",
          message: "Objectif d'épargne à 75% - Excellent progrès !",
          amount: 450000,
          severity: "low",
        },
      ]

      setCategoryData(mockCategoryData)
      setMonthlyTrend(mockMonthlyTrend)
      setRecentExpenses(mockRecentExpenses)
      setBudgetAlerts(mockAlerts)
    } catch (error) {
      console.error("Erreur lors du chargement des données budgétaires:", error)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((cat) => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const getCategoryColor = (categoryValue: string) => {
    const category = EXPENSE_CATEGORIES.find((cat) => cat.value === categoryValue)
    return category ? category.color : "#6B7280"
  }

  const handleExport = async (format: string) => {
    try {
      const result = await exportBudgetReport(format, "month")
      if (result.success) {
        alert(`✅ ${result.message}`)
      } else {
        alert(`❌ ${result.error}`)
      }
    } catch (error) {
      alert("❌ Erreur lors de l'export")
    }
  }

  const getBudgetStatusColor = (percent: number) => {
    if (percent > 100) return "text-red-600"
    if (percent > 85) return "text-orange-600"
    return "text-green-600"
  }

  const getBudgetProgressColor = (percent: number) => {
    if (percent > 100) return "bg-red-500"
    if (percent > 85) return "bg-orange-500"
    return "bg-green-500"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500 bg-red-50"
      case "medium":
        return "border-orange-500 bg-orange-50"
      case "low":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  // Gestion des effets après soumission
  useEffect(() => {
    if (budgetState?.success) {
      setIsBudgetDialogOpen(false)
      loadBudgetData()
    }
  }, [budgetState])

  useEffect(() => {
    if (expenseState?.success) {
      setIsExpenseDialogOpen(false)
      loadBudgetData()
    }
  }, [expenseState])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Budget Personnel</h1>
          <p className="text-gray-600">Planifiez, suivez et analysez votre budget mensuel</p>
        </div>
        <div className="flex space-x-2">
          {!budgetData.isConfigured && (
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <SettingsIcon />
                  <span className="ml-2">Configurer mon budget</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Configuration de votre budget mensuel</DialogTitle>
                </DialogHeader>
                <form action={budgetAction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nom complet</Label>
                      <Input id="fullName" name="fullName" defaultValue="Mamadou Diallo" required />
                    </div>
                    <div>
                      <Label htmlFor="account">Compte principal</Label>
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
                      <Label htmlFor="email">Adresse e-mail</Label>
                      <Input id="email" name="email" type="email" defaultValue="mamadou.diallo@example.com" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input id="phone" name="phone" defaultValue="+224 123 456 789" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monthlyIncome">Revenu mensuel (GNF)</Label>
                      <Input
                        id="monthlyIncome"
                        name="monthlyIncome"
                        type="number"
                        min="0"
                        defaultValue="3000000"
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
                        defaultValue="2400000"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Plafond à ne pas dépasser</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="savingsGoal">Objectif d'épargne mensuel (GNF)</Label>
                    <Input id="savingsGoal" name="savingsGoal" type="number" min="0" defaultValue="600000" required />
                    <p className="text-xs text-gray-500 mt-1">Montant que vous souhaitez épargner chaque mois</p>
                  </div>

                  {budgetState?.error && (
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertDescription>{budgetState.error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isBudgetPending}>
                      {isBudgetPending ? "Configuration..." : "Configurer mon budget"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
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
              <form action={expenseAction} className="space-y-4">
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
                    <Label htmlFor="category">Catégorie de dépense</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
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
                    <Label htmlFor="amount">Montant de la dépense (GNF)</Label>
                    <Input id="amount" name="amount" type="number" min="1" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date de la dépense</Label>
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

                {expenseState?.error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertDescription>{expenseState.error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isExpensePending}>
                    {isExpensePending ? "Enregistrement..." : "Ajouter la dépense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertes budgétaires */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert) => (
            <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
              {alert.type === "warning" ? <AlertTriangleIcon /> : <AlertCircleIcon />}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <TrendingUpIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(budgetData.monthlyIncome)} GNF</div>
            <p className="text-sm text-muted-foreground">Revenus du mois en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget mensuel</CardTitle>
            <div className="text-2xl">🎯</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(budgetData.monthlyBudget)} GNF</div>
            <p className="text-sm text-muted-foreground">Objectif de dépense fixé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses actuelles</CardTitle>
            <div className="text-2xl">💸</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBudgetStatusColor(budgetData.budgetUsagePercent)}`}>
              {formatAmount(budgetData.totalExpenses)} GNF
            </div>
            <p className="text-sm text-muted-foreground">{budgetData.budgetUsagePercent}% du budget utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargne actuelle</CardTitle>
            <PiggyBankIcon />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(budgetData.totalSavings)} GNF</div>
            <p className="text-sm text-muted-foreground">{budgetData.savingsPercent}% de l'objectif atteint</p>
          </CardContent>
        </Card>
      </div>

      {/* Jauges de progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progression budgétaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dépensé: {formatAmount(budgetData.totalExpenses)} GNF</span>
                <span>Budget: {formatAmount(budgetData.monthlyBudget)} GNF</span>
              </div>
              <Progress value={Math.min(budgetData.budgetUsagePercent, 100)} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className={getBudgetStatusColor(budgetData.budgetUsagePercent)}>
                  {budgetData.budgetUsagePercent}%
                </span>
                <span>100%</span>
              </div>
              {budgetData.remainingBudget > 0 && (
                <p className="text-sm text-green-600">
                  ✅ Il vous reste {formatAmount(budgetData.remainingBudget)} GNF pour ce mois
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectif d'épargne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Épargné: {formatAmount(budgetData.totalSavings)} GNF</span>
                <span>Objectif: {formatAmount(budgetData.savingsGoal)} GNF</span>
              </div>
              <Progress value={budgetData.savingsPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-blue-600">{budgetData.savingsPercent}%</span>
                <span>100%</span>
              </div>
              <p className="text-sm text-blue-600">
                💰 Encore {formatAmount(budgetData.savingsGoal - budgetData.totalSavings)} GNF pour atteindre votre
                objectif
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="trends">Évolution</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition budgétaire */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition du budget mensuel</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: { label: "Montant" },
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
                              <div className="bg-white p-3 border rounded shadow">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm">Dépensé: {formatAmount(data.value)} GNF</p>
                                <p className="text-sm">Budget: {formatAmount(data.budget)} GNF</p>
                                <p className={`text-xs ${data.percent > 100 ? "text-red-600" : "text-green-600"}`}>
                                  {data.percent}% du budget utilisé
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

            {/* Évolution mensuelle */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution Budget vs Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    budget: { label: "Budget", color: "#3B82F6" },
                    expenses: { label: "Dépenses", color: "#EF4444" },
                    savings: { label: "Épargne", color: "#10B981" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border rounded shadow">
                                <p className="font-medium">{label}</p>
                                <p className="text-sm text-blue-600">
                                  Budget: {formatAmount(payload[0]?.value || 0)} GNF
                                </p>
                                <p className="text-sm text-red-600">
                                  Dépenses: {formatAmount(payload[1]?.value || 0)} GNF
                                </p>
                                <p className="text-sm text-green-600">
                                  Épargne: {formatAmount(payload[2]?.value || 0)} GNF
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line type="monotone" dataKey="budget" stroke="#3B82F6" strokeWidth={2} name="Budget" />
                      <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Dépenses" />
                      <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} name="Épargne" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi par catégorie</CardTitle>
              <p className="text-sm text-gray-600">Comparez vos dépenses avec vos budgets alloués par catégorie</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categoryData.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium">{category.name}</span>
                        <Badge
                          variant={
                            category.percent > 100 ? "destructive" : category.percent > 85 ? "secondary" : "default"
                          }
                        >
                          {category.percent}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${category.percent > 100 ? "text-red-600" : "text-gray-900"}`}>
                          {formatAmount(category.value)} GNF
                        </div>
                        <div className="text-xs text-gray-500">sur {formatAmount(category.budget)} GNF</div>
                      </div>
                    </div>
                    <Progress value={Math.min(category.percent, 100)} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className={category.percent > 100 ? "text-red-600" : "text-gray-600"}>
                        {category.percent > 100
                          ? `Dépassé de ${category.percent - 100}%`
                          : `${100 - category.percent}% restant`}
                      </span>
                      {category.percent > 100 && (
                        <span className="text-red-600">+{formatAmount(category.value - category.budget)} GNF</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des tendances</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  budget: { label: "Budget", color: "#3B82F6" },
                  expenses: { label: "Dépenses", color: "#EF4444" },
                  income: { label: "Revenus", color: "#10B981" },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-green-600">
                                Revenus: {formatAmount(payload[2]?.value || 0)} GNF
                              </p>
                              <p className="text-sm text-blue-600">
                                Budget: {formatAmount(payload[0]?.value || 0)} GNF
                              </p>
                              <p className="text-sm text-red-600">
                                Dépenses: {formatAmount(payload[1]?.value || 0)} GNF
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="income" fill="#10B981" name="Revenus" />
                    <Bar dataKey="budget" fill="#3B82F6" name="Budget" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Dépenses" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dépenses récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      />
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{getCategoryLabel(expense.category)}</span>
                          <span>•</span>
                          <span>{expense.date}</span>
                          <span>•</span>
                          <Badge variant={expense.type === "automatic" ? "secondary" : "outline"}>
                            {expense.type === "automatic" ? "Auto" : "Manuel"}
                          </Badge>
                        </div>
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
                  Les rapports incluent l'analyse complète de votre budget personnel : revenus, dépenses par catégorie,
                  évolution mensuelle, objectifs d'épargne et recommandations personnalisées.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Résumé budgétaire mensuel</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Revenus mensuels:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatAmount(budgetData.monthlyIncome)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget alloué:</span>
                    <span className="ml-2 font-medium">{formatAmount(budgetData.monthlyBudget)} GNF</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total dépensé:</span>
                    <span className={`ml-2 font-medium ${getBudgetStatusColor(budgetData.budgetUsagePercent)}`}>
                      {formatAmount(budgetData.totalExpenses)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Épargne réalisée:</span>
                    <span className="ml-2 font-medium text-blue-600">{formatAmount(budgetData.totalSavings)} GNF</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taux d'utilisation:</span>
                    <span className={`ml-2 font-medium ${getBudgetStatusColor(budgetData.budgetUsagePercent)}`}>
                      {budgetData.budgetUsagePercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Objectif épargne:</span>
                    <span className="ml-2 font-medium text-blue-600">{budgetData.savingsPercent}% atteint</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">💡 Recommandations personnalisées</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Vous êtes sur la bonne voie pour atteindre vos objectifs d'épargne</li>
                    <li>• Attention au budget Alimentation qui dépasse de 7%</li>
                    <li>• Excellente gestion du budget Transport (-11% par rapport au budget alloué)</li>
                    <li>• Considérez augmenter votre objectif d'épargne de 50,000 GNF/mois</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
