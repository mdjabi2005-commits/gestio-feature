"use client"

import { cn } from "@/lib/utils"

interface GoalMetricLabelProps {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

export function GoalMetricLabel({ label, value, sub, highlight }: GoalMetricLabelProps) {
  return (
    <div className={cn(
      "p-4 rounded-3xl border transition-all flex flex-col items-center justify-center text-center",
      highlight 
        ? "bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
        : "bg-white/[0.02] border-white/5"
    )}>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
      <p className={cn(
        "text-xl font-black tabular-nums tracking-tighter",
        highlight ? "text-indigo-400" : "text-white"
      )}>
        {value}
      </p>
      {sub && <p className="text-[10px] font-bold text-white/20 mt-0.5">{sub}</p>}
    </div>
  )
}
