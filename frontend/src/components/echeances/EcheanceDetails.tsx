"use client"
import React, { useState } from 'react'
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Installment } from "./echeance-types"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { AmountDisplay } from "@/components/ui/AmountDisplay"
import { formatDate } from "@/lib/formatters"

interface EcheanceDetailsProps {
  selectedDate: string;
  items: Installment[];
}

export function EcheanceDetails({ selectedDate, items }: EcheanceDetailsProps) {
  const [showAll, setShowAll] = useState(false)
  const displayItems = showAll ? items : items.slice(0, 10)

  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06] animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-3 px-2">
        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 opacity-60">
          <CalendarIcon className="w-3 h-3 text-indigo-400" />
          {formatDate(selectedDate)}
        </h4>
        <span className="text-[10px] text-white/40 uppercase font-black">{items.length} échéance(s)</span>
      </div>
      
      {displayItems.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {displayItems.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200">
              <div className="flex items-center gap-3">
                <StatusBadge statut={item.statut} className="w-1.5 h-1.5 p-0 overflow-hidden text-[0px] border-none shadow-[0_0_8px_currentColor]" />
                <div>
                  <p className="text-xs font-bold text-white">{item.nom}</p>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.1em]">{item.categorie}</p>
                </div>
              </div>
              <AmountDisplay amount={item.montant} type={item.type} size="sm" />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Aucune échéance ce jour</div>
      )}

      {items.length > 10 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
        >
          {showAll ? "Réduire" : `+ ${items.length - 10} autres`}
        </button>
      )}
    </div>
  )
}
