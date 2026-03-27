import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from "@/lib/categories";

interface TransactionFormFieldsProps {
  type: 'Dépense' | 'Revenu';
  setType: (type: 'Dépense' | 'Revenu') => void;
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
}

export const TransactionFormFields: React.FC<TransactionFormFieldsProps> = ({
  type, setType,
  date, setDate,
  amount, setAmount,
  category, setCategory,
  subcategory, setSubcategory,
  description, setDescription,
}) => {
  const currentCategory = CATEGORIES.find(c => c.value === category);

  return (
    <div className="space-y-6">
      {/* Type Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Type</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType('Revenu')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
              type === 'Revenu'
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Revenu
          </button>
          <button
            type="button"
            onClick={() => setType('Dépense')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
              type === 'Dépense'
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
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
          <label className="text-sm font-medium text-gray-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
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
              amount === '' || amount === '0' 
                ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" 
                : "border-white/10"
            )}
          />
        </div>
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Catégorie</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory('');
            }}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-slate-900">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Sous-catégorie</label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">(Aucune)</option>
            {subcategory && !currentCategory?.subcategories.includes(subcategory) && (
              <option value={subcategory} className="bg-slate-900">{subcategory} (OCR)</option>
            )}
            {currentCategory?.subcategories.map(sub => (
              <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
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
