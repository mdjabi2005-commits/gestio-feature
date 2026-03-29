"use client"
import { CATEGORY_STYLES } from "@/lib/categories"
import type { Budget, SalaryPlan } from "@/api"

interface BudgetFocusViewProps {
  selectedCategory: string
  budgets: Budget[]
  spentByCategory: Record<string, number>
  activeSalaryPlan: SalaryPlan | null
  onAddSub: (name: string) => void
  onShowTransactions: (budget: Budget) => void
}

export function BudgetFocusView({
  selectedCategory,
  budgets,
  spentByCategory,
  activeSalaryPlan,
  onAddSub,
  onShowTransactions,
}: BudgetFocusViewProps) {
  const budgetObj = budgets.find(b => b.categorie === selectedCategory)
  const planItem = activeSalaryPlan?.items.find((c: any) => c.categorie === selectedCategory)
  const capacity = budgetObj?.montant_max || planItem?.montant || 0
  const subBudgets = budgets.filter(b => b.categorie.startsWith(`${selectedCategory} > `))
  const parentStyle = CATEGORY_STYLES[selectedCategory] || { couleur: '#6366f1' }
  
  const totalSpent = budgets
    .filter(b => b.categorie.startsWith(selectedCategory))
    .reduce((acc, b) => acc + (spentByCategory[b.categorie] || 0), 0)
  
  const spentPct = capacity > 0 ? Math.min((totalSpent / capacity) * 100, 100) : 0

  const subcategories = CATEGORY_STYLES[selectedCategory]?.subcategories || []

  return (
    <div className="space-y-6 mb-8 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedCategory}</h3>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Capacité Totale</p>
          <p className="text-xl font-black text-white">{capacity.toLocaleString("fr-FR")} €</p>
        </div>
      </div>

      <AllocationBar subBudgets={subBudgets} capacity={capacity} parentStyle={parentStyle} />
      <AllocationBar subBudgets={subBudgets} capacity={capacity} parentStyle={parentStyle} />
      <div 
        className="cursor-pointer group/spent"
        onClick={() => budgetObj && onShowTransactions(budgetObj)}
      >
        <SpentBar totalSpent={totalSpent} spentPct={spentPct} />
      </div>
      <SubcategorySelector selectedCategory={selectedCategory} budgets={budgets} subcategories={subcategories} onAddSub={onAddSub} />
    </div>
  )
}

function AllocationBar({ subBudgets, capacity, parentStyle }: { subBudgets: Budget[]; capacity: number; parentStyle: { couleur: string } }) {
  return (
    <div className="glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-indigo-400/60">
        <span>Planification des Sous-Budgets</span>
        <span>Allocations (%)</span>
      </div>
      <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden flex gap-0.5 p-0.5">
        {subBudgets.map((sub, idx, arr) => {
          const width = capacity > 0 ? (sub.montant_max / capacity) * 100 : 0
          const opacity = 1 - (idx / (arr.length || 1)) * 0.6
          return (
            <div 
              key={sub.categorie}
              className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${width}%`, backgroundColor: parentStyle.couleur, opacity }}
            />
          )
        })}
      </div>
    </div>
  )
}

function SpentBar({ totalSpent, spentPct }: { totalSpent: number; spentPct: number }) {
  return (
    <div className="glass-card p-4 rounded-2xl border border-white/11 bg-white/[0.04] space-y-3">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-rose-400/60">
        <span>Dépenses Réelles de l'Enveloppe</span>
        <span>{totalSpent.toLocaleString("fr-FR")}€</span>
      </div>
      <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000" style={{ width: `${spentPct}%` }} />
      </div>
    </div>
  )
}

function SubcategorySelector({ selectedCategory, budgets, subcategories, onAddSub }: { selectedCategory: string; budgets: Budget[]; subcategories: string[]; onAddSub: (name: string) => void }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Sous-catégories trackées</h3>
      <select 
        onChange={(e) => { if (e.target.value) onAddSub(e.target.value); e.target.value = "" }}
        className="bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer hover:bg-white/10 transition-all"
      >
        <option value="">+ Ajouter une sous-catégorie</option>
        {subcategories
          .filter((sub) => !budgets.some(b => b.categorie === `${selectedCategory} > ${sub}`))
          .map((sub) => (
            <option key={sub} value={sub} className="bg-[#121216]">{sub}</option>
          ))
        }
      </select>
    </div>
  )
}
