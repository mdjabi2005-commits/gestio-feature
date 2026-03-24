"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { TransactionTable, type Transaction } from "@/components/dashboard/transaction-table"
import { TransactionModal } from "@/components/dashboard/transaction-modal"
import { SunburstChart } from "@/components/dashboard/sunburst-chart"
import { FinancialCalendar } from "@/components/dashboard/financial-calendar"
import { BalanceChart } from "@/components/dashboard/balance-chart"
import { TransactionList, type TransactionItem } from "@/components/dashboard/transaction-list"

// Extended mock data for transactions
const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    description: "Salaire Mensuel",
    amount: 4500,
    category: "Salaire",
    categoryColor: "#6366f1",
    date: "2024-03-15",
  },
  {
    id: "2",
    type: "expense",
    description: "Courses Carrefour",
    amount: 187.50,
    category: "Alimentation",
    categoryColor: "#f59e0b",
    date: "2024-03-14",
  },
  {
    id: "3",
    type: "expense",
    description: "Abonnement Netflix",
    amount: 17.99,
    category: "Loisirs",
    categoryColor: "#14b8a6",
    date: "2024-03-12",
  },
  {
    id: "4",
    type: "income",
    description: "Projet Freelance",
    amount: 850,
    category: "Freelance",
    categoryColor: "#8b5cf6",
    date: "2024-03-10",
  },
  {
    id: "5",
    type: "expense",
    description: "Loyer Appartement",
    amount: 1200,
    category: "Logement",
    categoryColor: "#ec4899",
    date: "2024-03-01",
  },
  {
    id: "6",
    type: "expense",
    description: "Essence Total",
    amount: 75.40,
    category: "Transport",
    categoryColor: "#3b82f6",
    date: "2024-03-08",
  },
  {
    id: "7",
    type: "expense",
    description: "Pharmacie",
    amount: 32.50,
    category: "Santé",
    categoryColor: "#ef4444",
    date: "2024-03-06",
  },
  {
    id: "8",
    type: "income",
    description: "Dividendes Actions",
    amount: 124.30,
    category: "Investissement",
    categoryColor: "#10b981",
    date: "2024-03-05",
  },
  {
    id: "9",
    type: "expense",
    description: "Restaurant Le Bistrot",
    amount: 68.00,
    category: "Alimentation",
    categoryColor: "#f59e0b",
    date: "2024-03-04",
  },
  {
    id: "10",
    type: "expense",
    description: "Spotify Premium",
    amount: 10.99,
    category: "Loisirs",
    categoryColor: "#14b8a6",
    date: "2024-03-03",
  },
  {
    id: "11",
    type: "expense",
    description: "Assurance Auto",
    amount: 89.00,
    category: "Transport",
    categoryColor: "#3b82f6",
    date: "2024-03-02",
  },
  {
    id: "12",
    type: "income",
    description: "Remboursement Sécurité Sociale",
    amount: 45.60,
    category: "Santé",
    categoryColor: "#ef4444",
    date: "2024-03-01",
  },
]

// Extended transaction items with more details
const mockTransactionItems: TransactionItem[] = mockTransactions.map((t, i) => ({
  ...t,
  status: i === 2 ? "pending" : i === 5 ? "pending" : "completed",
  merchant: i === 1 ? "Carrefour City" : i === 8 ? "Le Bistrot Paris" : undefined,
}))

// Sunburst data with hierarchical categories
const sunburstData = [
  {
    name: "Logement",
    value: 1200,
    color: "#ec4899",
    children: [
      { name: "Loyer", value: 1000, color: "#f472b6" },
      { name: "Charges", value: 150, color: "#f9a8d4" },
      { name: "Assurance", value: 50, color: "#fbcfe8" },
    ],
  },
  {
    name: "Alimentation",
    value: 520,
    color: "#f59e0b",
    children: [
      { name: "Courses", value: 350, color: "#fbbf24" },
      { name: "Restaurants", value: 120, color: "#fcd34d" },
      { name: "Livraison", value: 50, color: "#fde68a" },
    ],
  },
  {
    name: "Transport",
    value: 280,
    color: "#3b82f6",
    children: [
      { name: "Essence", value: 150, color: "#60a5fa" },
      { name: "Assurance", value: 89, color: "#93c5fd" },
      { name: "Entretien", value: 41, color: "#bfdbfe" },
    ],
  },
  {
    name: "Loisirs",
    value: 185,
    color: "#14b8a6",
    children: [
      { name: "Streaming", value: 35, color: "#2dd4bf" },
      { name: "Sorties", value: 100, color: "#5eead4" },
      { name: "Sport", value: 50, color: "#99f6e4" },
    ],
  },
  {
    name: "Santé",
    value: 95,
    color: "#ef4444",
    children: [
      { name: "Pharmacie", value: 55, color: "#f87171" },
      { name: "Médecin", value: 40, color: "#fca5a5" },
    ],
  },
  {
    name: "Autre",
    value: 120,
    color: "#6b7280",
    children: [
      { name: "Divers", value: 80, color: "#9ca3af" },
      { name: "Cadeaux", value: 40, color: "#d1d5db" },
    ],
  },
]

// Calendar transaction data
const calendarTransactions = [
  { date: "2024-03-01", income: 0, expense: 1200 },
  { date: "2024-03-02", income: 0, expense: 89 },
  { date: "2024-03-03", income: 0, expense: 10.99 },
  { date: "2024-03-04", income: 0, expense: 68 },
  { date: "2024-03-05", income: 124.30, expense: 0 },
  { date: "2024-03-06", income: 0, expense: 32.50 },
  { date: "2024-03-08", income: 0, expense: 75.40 },
  { date: "2024-03-10", income: 850, expense: 0 },
  { date: "2024-03-12", income: 0, expense: 17.99 },
  { date: "2024-03-14", income: 0, expense: 187.50 },
  { date: "2024-03-15", income: 4500, expense: 0 },
  { date: "2024-03-18", income: 0, expense: 45.00 },
  { date: "2024-03-20", income: 200, expense: 0 },
  { date: "2024-03-22", income: 0, expense: 150 },
]

// Balance evolution data (last 90 days)
const generateBalanceData = () => {
  const data = []
  let balance = 20000
  const today = new Date()
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const income = Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 100 : 0
    const expense = Math.floor(Math.random() * 200) + 20
    
    balance = balance + income - expense
    
    data.push({
      date: date.toISOString().split("T")[0],
      balance: Math.max(balance, 0),
      income,
      expense,
    })
  }
  
  return data
}

const balanceData = generateBalanceData()

const mockCategories = [
  { name: "Logement", amount: 1200, color: "#ec4899", percentage: 35 },
  { name: "Alimentation", amount: 520, color: "#f59e0b", percentage: 22 },
  { name: "Transport", amount: 280, color: "#3b82f6", percentage: 15 },
  { name: "Loisirs", amount: 185, color: "#14b8a6", percentage: 12 },
  { name: "Santé", amount: 95, color: "#ef4444", percentage: 8 },
  { name: "Autre", amount: 120, color: "#6b7280", percentage: 8 },
]

const viewTitles: Record<string, string> = {
  dashboard: "Tableau de bord",
  transactions: "Transactions",
  recurrences: "Récurrences",
  settings: "Paramètres",
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("dashboard")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "loading">("loading")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Simulate API connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setApiStatus("connected")
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Calculate KPIs
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = 24680.45 // Mock total balance

  // Filter transactions by selected date
  const filteredTransactionItems = useMemo(() => {
    if (!selectedDate) return mockTransactionItems
    return mockTransactionItems.filter((t) => t.date === selectedDate)
  }, [selectedDate])

  const handleAddTransaction = (data: {
    type: "income" | "expense"
    date: string
    amount: number
    category: string
    description: string
  }) => {
    const categoryColors: Record<string, string> = {
      salaire: "#6366f1",
      freelance: "#8b5cf6",
      investissement: "#10b981",
      alimentation: "#f59e0b",
      transport: "#3b82f6",
      logement: "#ec4899",
      loisirs: "#14b8a6",
      sante: "#ef4444",
      autre: "#6b7280",
    }

    const categoryLabels: Record<string, string> = {
      salaire: "Salaire",
      freelance: "Freelance",
      investissement: "Investissement",
      alimentation: "Alimentation",
      transport: "Transport",
      logement: "Logement",
      loisirs: "Loisirs",
      sante: "Santé",
      autre: "Autre",
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: data.type,
      description: data.description,
      amount: data.amount,
      category: categoryLabels[data.category] || data.category,
      categoryColor: categoryColors[data.category] || "#6b7280",
      date: data.date,
    }

    setTransactions([newTransaction, ...transactions])
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          title={viewTitles[activeView]}
          onAddTransaction={() => setIsModalOpen(true)}
          apiStatus={apiStatus}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeView === "dashboard" && (
            <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* KPI Cards */}
              <KpiCards balance={balance} income={income} expenses={expenses} />

              {/* Charts & Tables Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Category Chart */}
                <CategoryChart
                  categories={mockCategories}
                  title="Répartition des dépenses"
                />

                {/* Quick Stats */}
                <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30">
                  <h3 className="text-lg font-semibold text-foreground mb-6">
                    Aperçu Mensuel
                  </h3>
                  <div className="space-y-6">
                    {/* Savings Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Taux d'épargne
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">
                          32%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                          style={{ width: "32%" }}
                        />
                      </div>
                    </div>

                    {/* Budget Used */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Budget utilisé
                        </span>
                        <span className="text-sm font-semibold text-indigo-400">
                          68%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
                          style={{ width: "68%" }}
                        />
                      </div>
                    </div>

                    {/* Goal Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Objectif annuel
                        </span>
                        <span className="text-sm font-semibold text-violet-400">
                          45%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000 ease-out"
                          style={{ width: "45%" }}
                        />
                      </div>
                    </div>

                    {/* Monthly Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div className="text-center p-4 rounded-xl bg-secondary/30">
                        <span className="text-2xl font-bold text-foreground">
                          {transactions.length}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Transactions
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-secondary/30">
                        <span className="text-2xl font-bold text-foreground">
                          6
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Catégories
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <TransactionTable transactions={transactions.slice(0, 6)} />
            </div>
          )}

          {activeView === "transactions" && (
            <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-12 gap-6">
                {/* Balance Chart - Full width top */}
                <div className="col-span-12 xl:col-span-8 h-[350px]">
                  <BalanceChart data={balanceData} title="Évolution du solde" />
                </div>

                {/* Calendar - Right side */}
                <div className="col-span-12 xl:col-span-4 h-[350px]">
                  <FinancialCalendar
                    transactions={calendarTransactions}
                    selectedDate={selectedDate}
                    onDateSelect={(date) =>
                      setSelectedDate(selectedDate === date ? null : date)
                    }
                  />
                </div>

                {/* Sunburst Chart */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 h-[500px]">
                  <SunburstChart
                    data={sunburstData}
                    title="Répartition hiérarchique"
                  />
                </div>

                {/* Transaction List */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 h-[500px]">
                  <TransactionList
                    transactions={filteredTransactionItems}
                    title={
                      selectedDate
                        ? `Transactions du ${new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                        : "Toutes les transactions"
                    }
                    onSearch={(query) => console.log("Search:", query)}
                  />
                </div>

                {/* Quick Stats Row */}
                <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Income */}
                  <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-emerald-500/30 hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-emerald-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 11l5-5m0 0l5 5m-5-5v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Revenus totaux
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          +{income.toLocaleString("fr-FR")}€
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-rose-500/30 hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-rose-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 13l-5 5m0 0l-5-5m5 5V6"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Dépenses totales
                        </p>
                        <p className="text-lg font-bold text-rose-400">
                          -{expenses.toLocaleString("fr-FR")}€
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transactions Count */}
                  <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-indigo-500/30 hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Transactions
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {transactions.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Average per day */}
                  <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/30 hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-violet-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Moyenne/jour
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round(expenses / 30).toLocaleString("fr-FR")}€
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "recurrences" && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Récurrences
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Gérez vos transactions récurrentes comme les abonnements, loyers
                  et salaires pour un suivi automatisé.
                </p>
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Paramètres
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Configurez vos préférences, gérez votre compte et personnalisez
                  votre expérience Gestio V4.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
      />
    </div>
  )
}
