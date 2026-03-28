"use client"
import React from 'react'
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatters"

interface AmountDisplayProps {
  amount: number;
  type?: "depense" | "revenu" | "income" | "expense";
  className?: string;
  size?: "sm" | "md" | "lg";
  showSign?: boolean;
}

export function AmountDisplay({ 
  amount, 
  type, 
  className, 
  size = "md",
  showSign = true
}: AmountDisplayProps) {
  const isIncome = type === "revenu" || type === "income"
  const isExpense = type === "depense" || type === "expense"
  
  const sizeStyles = {
    sm: "text-xs font-bold",
    md: "text-sm font-extrabold",
    lg: "text-2xl font-black tracking-tighter"
  }

  return (
    <p className={cn(
      sizeStyles[size],
      isIncome ? "text-emerald-400" : isExpense ? "text-rose-400" : "text-foreground",
      className
    )}>
      {formatCurrency(amount, showSign ? type : undefined)}
    </p>
  )
}
