"use client"

import React from "react"
import { History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/api"

interface GoalHistoryProps {
  transactions: Transaction[]
}

export function GoalHistory({ transactions }: GoalHistoryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-indigo-400" /> Mémoire
         </h3>
         <span className="text-[10px] font-bold text-white/20">{transactions.length} tx.</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {transactions.length === 0 ? (
          <div className="py-10 text-center space-y-2 opacity-20">
             <History className="w-8 h-8 mx-auto" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Aucune trace</p>
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="p-3 rounded-2xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5 group">
               <div className="flex items-center justify-between">
                  <div className="min-w-0">
                     <p className="text-xs font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{tx.merchant || tx.description || 'Transaction'}</p>
                     <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className={cn(
                    "text-xs font-black tabular-nums shrink-0 italic",
                    tx.type === 'depense' ? "text-rose-400/80" : "text-emerald-400/80"
                  )}>
                     {tx.type === 'depense' ? '-' : '+'}{tx.montant.toLocaleString("fr-FR")}€
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
