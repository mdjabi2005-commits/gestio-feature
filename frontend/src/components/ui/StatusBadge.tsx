"use client"
import React from 'react'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "paid" | "pending" | "overdue" | "failed" | "completed" | string

interface StatusBadgeProps {
  statut: StatusType;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: { label: "Payé", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  completed: { label: "Complété", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "En attente", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  overdue: { label: "À vérifier", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  failed: { label: "Échoué", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
}

export function StatusBadge({ statut, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[statut.toLowerCase()] || { label: statut, className: "bg-secondary/50 text-muted-foreground" }
  
  return (
    <Badge 
      variant="outline" 
      className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
