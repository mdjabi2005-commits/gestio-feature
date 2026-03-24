"use client"

import { useState } from "react"
import { X, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    type: "income" | "expense"
    date: string
    amount: number
    category: string
    description: string
  }) => void
}

const categories = [
  { value: "salaire", label: "Salaire", color: "#6366f1" },
  { value: "freelance", label: "Freelance", color: "#8b5cf6" },
  { value: "investissement", label: "Investissement", color: "#10b981" },
  { value: "alimentation", label: "Alimentation", color: "#f59e0b" },
  { value: "transport", label: "Transport", color: "#3b82f6" },
  { value: "logement", label: "Logement", color: "#ec4899" },
  { value: "loisirs", label: "Loisirs", color: "#14b8a6" },
  { value: "sante", label: "Santé", color: "#ef4444" },
  { value: "autre", label: "Autre", color: "#6b7280" },
]

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<"income" | "expense">("expense")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !description) return

    onSubmit({
      type,
      date,
      amount: parseFloat(amount),
      category,
      description,
    })

    // Reset form
    setType("expense")
    setDate(new Date().toISOString().split("T")[0])
    setAmount("")
    setCategory("")
    setDescription("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-2xl shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="text-xl font-semibold text-foreground">
            Nouvelle Transaction
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("income")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  type === "income"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Revenu
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  type === "expense"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary"
                )}
              >
                <TrendingDown className="w-4 h-4" />
                Dépense
              </button>
            </div>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="date"
                className="text-sm font-medium text-foreground"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="amount"
                className="text-sm font-medium text-foreground"
              >
                Montant (€)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="text-sm font-medium text-foreground"
            >
              Catégorie
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Sélectionner une catégorie
              </option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Courses Carrefour"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 relative px-4 py-3 rounded-xl font-medium text-sm text-primary-foreground overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Ajouter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
