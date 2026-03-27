"use client"
import React from 'react'
import { Tag, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORIES } from "@/lib/categories"

interface CategorySubcategorySelectProps {
  category: string;
  setCategory: (val: string) => void;
  subcategory: string;
  setSubcategory: (val: string) => void;
  variant?: "transaction" | "installment";
}

export function CategorySubcategorySelect({
  category,
  setCategory,
  subcategory,
  setSubcategory,
  variant = "transaction"
}: CategorySubcategorySelectProps) {
  const currentCategory = CATEGORIES.find(c => c.value === category);
  
  const labelClass = variant === "installment" ? "block text-xs font-medium text-white/50 mb-1" : "text-sm font-medium text-gray-300";
  const fieldClass = variant === "installment" ? "w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.12] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-all appearance-none pl-9" : "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className={labelClass}>Catégorie</label>
        <div className="relative">
          {variant === "installment" && <Tag className={iconClass} />}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory('');
            }}
            className={fieldClass}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-[#0f0f13]">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Sous-catégorie</label>
        <div className="relative">
          {variant === "installment" && <List className={iconClass} />}
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className={fieldClass}
          >
            <option value="" className="bg-[#0f0f13]">(Aucune)</option>
            {subcategory && !currentCategory?.subcategories.includes(subcategory) && (
              <option value={subcategory} className="bg-[#0f0f13]">{subcategory} (OCR)</option>
            )}
            {currentCategory?.subcategories.map(sub => (
              <option key={sub} value={sub} className="bg-[#0f0f13]">{sub}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
