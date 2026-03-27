"use client"
import { useState, useEffect } from "react"
import { X, Target, Calendar } from "lucide-react"
import { GOAL_CATEGORIES } from "@/lib/goal-categories"
import type { Objectif } from "@/api"

interface GoalFormProps {
  initial: Objectif | null
  onSave: (goal: Objectif) => Promise<void>
  onClose: () => void
}

export function GoalForm({ initial, onSave, onClose }: GoalFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Objectif>({
    nom: "",
    montant_cible: 0,
    categorie: "ÉpargneUrgence",
    date_echeance: "",
    description: "",
  })

  useEffect(() => {
    if (initial) setFormData(initial)
  }, [initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg overflow-hidden glass-card rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-400" />
             </div>
             <h2 className="text-xl font-bold text-white">{initial ? "Modifier l'objectif" : "Nouvel objectif"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-card/10">
          <div className="space-y-4">
            {/* Nom */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 ml-1">Nom de l'objectif</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Ex: Voyage au Japon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Montant Cible */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 ml-1">Montant cible (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.montant_cible || ""}
                  onChange={(e) => setFormData({ ...formData, montant_cible: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="3000"
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-white/40 ml-1">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                >
                  {GOAL_CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name} className="bg-slate-900">{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date d'échéance */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 ml-1">Date d'échéance (optionnel)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="date"
                  value={formData.date_echeance}
                  onChange={(e) => setFormData({ ...formData, date_echeance: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40 ml-1">Description (optionnel)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[80px]"
                placeholder="Détails sur l'épargne..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-2xl bg-white/[0.05] text-white/60 font-bold text-sm hover:bg-white/[0.1] transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-4 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? "Chargement..." : initial ? "Enregistrer" : "Créer l'objectif"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

