"use client"

import { cn } from "@/lib/utils"
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ReactNode
  iconBg: string
}

function KpiCard({ title, value, change, changeType, icon, iconBg }: KpiCardProps) {
  return (
    <div className="group glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              changeType === "positive"
                ? "text-emerald-400"
                : changeType === "negative"
                ? "text-red-400"
                : "text-muted-foreground"
            )}
          >
            {changeType === "positive" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="w-4 h-4" />
            ) : null}
            <span>{change}</span>
            <span className="text-muted-foreground font-normal">vs mois dernier</span>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

interface KpiCardsProps {
  balance: number
  income: number
  expenses: number
}

export function KpiCards({ balance, income, expenses }: KpiCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const incomeChange = "+12.5%"
  const expenseChange = "+8.2%"
  const balanceChange = "+4.3%"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard
        title="Balance Totale"
        value={formatCurrency(balance)}
        change={balanceChange}
        changeType="positive"
        icon={<Wallet className="w-6 h-6 text-indigo-400" />}
        iconBg="bg-indigo-500/10"
      />
      <KpiCard
        title="Revenus du mois"
        value={formatCurrency(income)}
        change={incomeChange}
        changeType="positive"
        icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
        iconBg="bg-emerald-500/10"
      />
      <KpiCard
        title="Dépenses du mois"
        value={formatCurrency(expenses)}
        change={expenseChange}
        changeType="negative"
        icon={<TrendingDown className="w-6 h-6 text-red-400" />}
        iconBg="bg-red-500/10"
      />
    </div>
  )
}
