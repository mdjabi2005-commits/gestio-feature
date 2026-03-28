"use client"

import { useState, useMemo } from "react"
import { Plus, Wallet, TrendingDown, Target, AlertTriangle, CheckCircle2, PiggyBank } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { CATEGORY_STYLES } from "@/lib/categories"
import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { PlanningSummary } from "@/components/budgets/PlanningSummary"
import { StrategyCard } from "@/components/budgets/StrategyCard"
import { SalaryPlanSetup } from "@/components/budgets/SalaryPlanSetup"
import { calculatePlannedExpenses, calculatePlannedIncomes, getMonthOccurrences } from "@/lib/budget-utils"
import { getCategoryIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import type { Budget, Echeance, SalaryPlan, SalaryPlanItem } from "@/api"

export default function BudgetsPage() {
  const { 
    budgets, transactions, setBudget, deleteBudget, budgetsLoading, 
    summary, echeances, activeSalaryPlan, setSalaryPlan 
  } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [showPlanSetup, setShowPlanSetup] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Dépenses et Revenus réels du mois par catégorie
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "depense" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie;
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null;
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant;
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant;
        }
      }
    })
    return map
  }, [transactions, month, year])

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "revenu" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie;
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null;
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant;
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant;
        }
      }
    })
    return map
  }, [transactions, month, year])

  // Prévisions (échéances à venir) par catégorie
  const plannedExpensesByCategory = useMemo(() => {
    return calculatePlannedExpenses(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  const plannedIncomeByCategory = useMemo(() => {
    return calculatePlannedIncomes(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  // Global stats
  const totalBudget = budgets.reduce((s, b) => s + b.montant_max, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.categorie] ?? 0), 0)
  const totalIncome = budgets.reduce((s, b) => s + (incomeByCategory[b.categorie] ?? 0), 0)
  
  const totalPlannedExpenses = budgets.reduce((s, b) => s + (plannedExpensesByCategory[b.categorie] ?? 0), 0)
  const totalPlannedIncome = budgets.reduce((s, b) => s + (plannedIncomeByCategory[b.categorie] ?? 0), 0)
  
  const totalForecastedExpenses = totalSpent + totalPlannedExpenses
  const totalForecastedIncome = totalIncome + totalPlannedIncome
  const totalForecastedSavings = totalForecastedIncome - totalForecastedExpenses
  
  const globalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const forecastPct = totalBudget > 0 ? Math.min((totalForecastedExpenses / totalBudget) * 100, 100) : 0
  
  const overBudget = budgets.filter(b => (spentByCategory[b.categorie] ?? 0) > b.montant_max)
  const potentiallyOver = budgets.filter(b => {
    const spent = spentByCategory[b.categorie] ?? 0
    const planned = plannedExpensesByCategory[b.categorie] ?? 0
    return spent <= b.montant_max && (spent + planned) > b.montant_max
  })

  const allCategories = summary?.repartition_categories ?? []

  // Filtrage
  const parentCategories = useMemo(() => {
    const set = new Set<string>()
    budgets.forEach(b => {
      const parent = b.categorie.includes(' > ') ? b.categorie.split(' > ')[0] : b.categorie
      set.add(parent)
    })
    return Array.from(set).sort()
  }, [budgets])

  const filteredBudgets = useMemo(() => {
    if (!selectedCategory) {
      // Filtrer : on ne garde les parents que s'ils n'ont AUCUNE sous-catégorie définie
      const subCategoryParents = new Set(
        budgets
          .filter(b => b.categorie.trim().includes(' > '))
          .map(b => b.categorie.trim().split(' > ')[0])
      )

      const leafBudgets = budgets.filter(b => {
        const cat = b.categorie.trim()
        const isParent = !cat.includes(' > ')
        if (isParent) {
          return !subCategoryParents.has(cat)
        }
        return true
      })

      return leafBudgets.sort((a, b) => {
        const catA = a.categorie.trim()
        const catB = b.categorie.trim()
        const pA = catA.split(' > ')[0]
        const pB = catB.split(' > ')[0]
        if (pA === pB) return catA.localeCompare(catB)
        return pA.localeCompare(pB)
      })
    }
    return budgets.filter(b => b.categorie.trim().startsWith(selectedCategory) && b.categorie.trim() !== selectedCategory)
  }, [budgets, selectedCategory])

  const handleEdit = (budget: Budget) => { setEditTarget(budget); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditTarget(null) }

  const handleAddSub = async (subName: string) => {
    if (!selectedCategory) return
    const newBudget: Budget = {
      categorie: `${selectedCategory} > ${subName}`,
      montant_max: 0 // Will be adjusted with the slider
    }
    await setBudget(newBudget)
  }

  if (budgetsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {budgets.length > 0 ? `${budgets.length} catégorie${budgets.length > 1 ? "s" : ""} suivie${budgets.length > 1 ? "s" : ""}` : "Aucun budget défini"}
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Nouveau budget
        </button>
      </div>

      {/* Synergy Planning Section */}
      <div className="space-y-6 mb-10">
        {!activeSalaryPlan ? (
          <div className="glass-card rounded-3xl p-8 border-indigo-500/20 bg-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <PiggyBank className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Initialiser votre Plan</h2>
                <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
                  Définissez votre revenu de référence et vos règles d'allocation pour générer vos budgets automatiquement.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowPlanSetup(true)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
            >
              C'est parti !
            </button>
          </div>
        ) : (
          <div className="relative group">
            {(() => {
              // Récupération de TOUTES les occurrences prévues pour le mois en cours (peu importe le statut de paiement)
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();

              let totalStrategicIncome = 0;
              let totalStrategicExpense = 0;
              const fixedExpenseCategories = new Set<string>();

              echeances.forEach(ech => {
                // Les statuts retournés par l'API sont 'pending', 'overdue' ou 'paid'
                if (ech.status === 'paid' || ech.status === 'inactive') return;
                
                const occurrences = getMonthOccurrences(ech, year, month);
                const amount = Number(ech.amount) || 0;
                const totalAmount = occurrences.length * amount;
                
                if (totalAmount > 0) {
                  if (ech.type === 'income') {
                    totalStrategicIncome += totalAmount;
                  } else {
                    totalStrategicExpense += totalAmount;
                    const cat = ech.category.trim().toLowerCase();
                    fixedExpenseCategories.add(cat);
                    if (ech.sous_categorie) {
                      fixedExpenseCategories.add(`${cat} > ${ech.sous_categorie.trim().toLowerCase()}`);
                    }
                  }
                }
              });

              // Solde "Reste fin de mois" stratégique
              const fixedChargesBalance = totalStrategicIncome - totalStrategicExpense;

              // Somme des budgets variables (uniquement ceux qui ne sont pas déjà couverts par une échéance fixe)
              const totalVariableBudgets = budgets.reduce((acc, b) => {
                const cat = b.categorie.trim().toLowerCase();
                const isSub = cat.includes(' > ');
                const parentCat = isSub ? cat.split(' > ')[0] : cat;
                
                if (fixedExpenseCategories.has(cat) || fixedExpenseCategories.has(parentCat)) {
                  return acc;
                }
                return acc + b.montant_max;
              }, 0);

              return (
                <PlanningSummary 
                  referenceSalary={activeSalaryPlan.reference_salary}
                  fixedChargesBalance={fixedChargesBalance}
                  variableBudgets={totalVariableBudgets}
                  planName={activeSalaryPlan.nom}
                />
              );
            })()}
            
            <button 
              onClick={() => setShowPlanSetup(true)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Modifier le plan"
            >
              <TrendingDown className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
        
        {/* Uber Strategy Card (if deficit) */}
        {(() => {
          const refSalary = activeSalaryPlan?.reference_salary || 0;
          const totalOutflow = budgets.reduce((s, b) => s + b.montant_max, 0);
          const deficit = refSalary - totalOutflow;
          return deficit < 0 ? <StrategyCard deficit={deficit} className="animate-in fade-in slide-in-from-top-4 duration-700" /> : null;
        })()}
      </div>

      {/* Plan Setup Drawer/Modal */}
      {showPlanSetup && (
        <SalaryPlanSetup 
          plan={activeSalaryPlan} 
          onSave={setSalaryPlan} 
          onClose={() => setShowPlanSetup(false)} 
        />
      )}

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide no-scrollbar">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 border",
            !selectedCategory ? "bg-white/10 text-white border-white/20" : "bg-white/[0.02] text-white/40 border-transparent hover:bg-white/5"
          )}
        >
          Tous
        </button>
        {parentCategories.map(cat => {
          const style = CATEGORY_STYLES[cat] || { icone: 'help-circle', couleur: '#666' }
          const IconComp = getCategoryIcon(style.icone)
          return (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 border",
                selectedCategory === cat 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-white/[0.02] text-white/40 border-transparent hover:bg-white/5"
              )}
            >
              <IconComp className="w-3.5 h-3.5" style={{ color: selectedCategory === cat ? style.couleur : 'inherit' }} />
              {cat}
            </button>
          )
        })}
      </div>

      {/* Focus Mode Header & Envelope Bar */}
      {selectedCategory && (
        <div className="space-y-6 mb-8 animate-in slide-in-from-top-2 duration-300">
           {/* Envelope Header */}
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                {selectedCategory}
              </h3>
              <div className="text-right">
                 <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Capacité Totale</p>
                 <p className="text-xl font-black text-white">
                   {(() => {
                      const budgetObj = budgets.find(b => b.categorie === selectedCategory)
                      if (budgetObj) return budgetObj.montant_max.toLocaleString("fr-FR")
                      
                      // Fallback sur le SalaryPlan si le budget n'est pas "créé"
                      const planItem = activeSalaryPlan?.items.find((c: SalaryPlanItem) => c.categorie === selectedCategory)
                      return (planItem?.montant || 0).toLocaleString("fr-FR")
                   })()} €
                 </p>
              </div>
           </div>

           {/* Dual Progress Bars */}
           <div className="grid grid-cols-1 gap-4">
             {/* 1. Allocation Bar (What we PLAN to spend) */}
             <div className="glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3">
               <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-indigo-400/60">
                 <span>Planification des Sous-Budgets</span>
                 <span>Allocations (%)</span>
               </div>
               <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  {budgets
                    .filter(b => b.categorie.startsWith(`${selectedCategory} > `))
                    .map((sub, idx, arr) => {
                      const parentBudget = budgets.find(pb => pb.categorie === selectedCategory)
                      const parentStyle = CATEGORY_STYLES[selectedCategory] || { couleur: '#6366f1' }
                      const width = parentBudget && parentBudget.montant_max > 0 
                        ? (sub.montant_max / parentBudget.montant_max) * 100 
                        : 0
                      
                      const opacity = 1 - (idx / (arr.length || 1)) * 0.6
                      
                      return (
                        <div 
                          key={sub.categorie}
                          className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                          style={{ 
                            width: `${width}%`, 
                            backgroundColor: parentStyle.couleur,
                            opacity: opacity
                          }}
                        />
                      )
                    })
                  }
               </div>
             </div>

             {/* 2. Real Spending Bar (What we ACTUALLY spent) */}
             <div className="glass-card p-4 rounded-2xl border border-white/11 bg-white/[0.04] space-y-3">
               <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-rose-400/60">
                 <span>Dépenses Réelles de l'Enveloppe</span>
                 <span>{
                    (() => {
                      const totalSpent = budgets
                        .filter(b => b.categorie.startsWith(selectedCategory))
                        .reduce((acc, b) => acc + (spentByCategory[b.categorie] || 0), 0)
                      return totalSpent.toLocaleString("fr-FR")
                    })()
                 }€</span>
               </div>
               <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000"
                    style={{ 
                      width: `${(() => {
                        const parentBudget = budgets.find(pb => pb.categorie === selectedCategory)
                        const totalSpent = budgets
                          .filter(b => b.categorie.startsWith(selectedCategory))
                          .reduce((acc, b) => acc + (spentByCategory[b.categorie] || 0), 0)
                        return parentBudget && parentBudget.montant_max > 0 
                          ? Math.min((totalSpent / parentBudget.montant_max) * 100, 100) 
                          : 0
                      })()}%` 
                    }}
                  />
               </div>
             </div>
           </div>

           <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Sous-catégories trackées</h3>
             </div>
             
             <select 
               onChange={(e) => {
                 if (e.target.value) handleAddSub(e.target.value)
                 e.target.value = ""
               }}
               className="bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer hover:bg-white/10 transition-all"
             >
               <option value="">+ Ajouter une sous-catégorie</option>
               {(CATEGORY_STYLES[selectedCategory]?.subcategories || [])
                 .filter(sub => !budgets.some(b => b.categorie === `${selectedCategory} > ${sub}`))
                 .map(sub => (
                   <option key={sub} value={sub} className="bg-[#121216]">{sub}</option>
                 ))
               }
             </select>
           </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-indigo-400/50" />
          </div>
          <p className="text-white/40 text-sm">Aucun budget défini pour cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((b) => {
            const isSub = b.categorie.includes(' > ')
            const parentName = isSub ? b.categorie.split(' > ')[0] : null
            
            // On cherche le budget parent dans les budgets existants
            let parentBudget = parentName ? budgets.find(pb => pb.categorie === parentName) : null
            
            // Si on ne le trouve pas mais qu'on a un plan de salaire, on crée un "objet" virtuel
            // pour que les sliders puissent fonctionner avec la capacité du plan.
            if (!parentBudget && parentName && activeSalaryPlan) {
               const planItem = activeSalaryPlan.items.find(c => c.categorie === parentName)
               if (planItem) {
                 parentBudget = {
                   categorie: parentName,
                   montant_max: planItem.montant
                 }
               }
            }

            return (
              <BudgetCard
                key={b.id || b.categorie}
                budget={b}
                spent={spentByCategory[b.categorie] ?? 0}
                planned={plannedExpensesByCategory[b.categorie] ?? 0}
                income={incomeByCategory[b.categorie] ?? 0}
                plannedIncome={plannedIncomeByCategory[b.categorie] ?? 0}
                allCategories={allCategories}
                onDelete={deleteBudget}
                onEdit={handleEdit}
                isFiltered={!!selectedCategory}
                parentBudget={parentBudget}
              />
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BudgetForm initial={editTarget} onSave={setBudget} onClose={handleClose} />
      )}
    </div>
  )
}
