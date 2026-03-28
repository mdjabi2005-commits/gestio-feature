"use client"
import { CATEGORY_STYLES } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface BudgetCategoryFilterProps {
  parentCategories: string[]
  selectedCategory: string | null
  onSelectCategory: (cat: string | null) => void
}

export function BudgetCategoryFilter({
  parentCategories,
  selectedCategory,
  onSelectCategory,
}: BudgetCategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide no-scrollbar">
      <button 
        onClick={() => onSelectCategory(null)}
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
            onClick={() => onSelectCategory(cat)}
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
  )
}
