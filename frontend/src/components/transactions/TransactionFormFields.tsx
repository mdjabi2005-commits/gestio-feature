"use client"
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategorySubcategorySelect } from "@/components/ui/CategorySubcategorySelect";
import { useFinancial } from '@/context/FinancialDataContext';

interface TransactionFormFieldsProps {
  type: 'depense' | 'revenu';
  setType: (type: 'depense' | 'revenu') => void;
  date: string;
  setDate: (date: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  category: string;
  setCategory: (category: string) => void;
  subcategory: string;
  setSubcategory: (subcategory: string) => void;
  description: string;
  setDescription: (description: string) => void;
  objectifId?: number | null;
  setObjectifId?: (id: number | null) => void;
}

export const TransactionFormFields: React.FC<TransactionFormFieldsProps> = ({
  type, setType,
  date, setDate,
  amount, setAmount,
  category, setCategory,
  subcategory, setSubcategory,
  description, setDescription,
  objectifId, setObjectifId
}) => {
  const { objectifs, showFinishedGoals } = useFinancial();

  const visibleObjectifs = React.useMemo(() => {
    if (showFinishedGoals) return objectifs;
    return objectifs.filter(o => (o.montant_actuel || 0) < (o.montant_cible || 0));
  }, [objectifs, showFinishedGoals]);

  return (
    <div className="space-y-6 text-left">
      {/* Type Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Type</label>
        <div className="flex gap-3">
          {(['revenu', 'depense'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                type === t
                  ? (t === 'revenu' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30")
                  : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
              )}
            >
              {t === 'revenu' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm shadow-inner"
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-gray-300">Montant (€)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={cn(
              "w-full px-4 py-3 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm",
              amount === '' || amount === '0' ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-white/10"
            )}
          />
        </div>
      </div>

      <CategorySubcategorySelect 
        category={category} 
        setCategory={setCategory} 
        subcategory={subcategory} 
        setSubcategory={setSubcategory} 
      />

      {/* Goal Selector */}
      {setObjectifId && (
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium text-gray-300">Objectif lié (optionnel)</label>
          <select
            value={objectifId || ""}
            onChange={(e) => setObjectifId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
          >
            <option value="" className="bg-slate-900 text-gray-400">Aucun objectif</option>
            {visibleObjectifs.map(goal => (
              <option key={goal.id} value={goal.id} className="bg-slate-900">
                {goal.nom} ({Math.round(goal.progression_pourcentage || 0)}%)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2 text-left">
        <label className="text-sm font-medium text-gray-300">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Courses Carrefour"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>
    </div>
  );
};
