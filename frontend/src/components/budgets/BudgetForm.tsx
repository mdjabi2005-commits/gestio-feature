"use client"
import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/lib/categories"
import type { Budget } from "@/api"

interface BudgetFormProps {
  initial?: Budget | null
  onSave: (data: Budget) => Promise<void>
  onClose: () => void
}

export function BudgetForm({ initial, onSave, onClose }: BudgetFormProps) {
  const [categorie, setCategorie] = useState(initial?.categorie ?? "")
  const [montant, setMontant] = useState(initial?.montant_max?.toString() ?? "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) { setCategorie(initial.categorie); setMontant(initial.montant_max.toString()) }
  }, [initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categorie || !montant) return
    setLoading(true)
    try { await onSave({ id: initial?.id, categorie, montant_max: parseFloat(montant) }) }
    finally { setLoading(false); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0f0f13] border border-white/[0.08] rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{initial ? "Modifier le budget" : "Nouveau budget"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Catégorie</label>
            <select
              value={categorie}
              onChange={e => setCategorie(e.target.value)}
              disabled={!!initial}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.filter(c => !["Revenu", "Dépense", "Bourse"].includes(c.value)).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Limite mensuelle (€)</label>
            <input
              type="number" min="1" step="0.01"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="Ex: 500"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-white/50 border border-white/[0.08] hover:bg-white/[0.04] transition-all">Annuler</button>
            <button type="submit" disabled={loading} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all", loading ? "bg-indigo-500/30 text-white/50" : "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30")}>
              <Save className="w-4 h-4" />{loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
