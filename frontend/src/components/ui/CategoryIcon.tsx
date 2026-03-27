"use client"
import React from 'react'
import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/icons"
import { getCategoryMetadata } from "@/lib/categories"

interface CategoryIconProps {
  category: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "solid";
  categories?: any[];
  showTypeIndicator?: "income" | "expense" | null;
}

export function CategoryIcon({ 
  category, 
  className, 
  size = "md", 
  variant = "ghost", 
  categories = [],
  showTypeIndicator 
}: CategoryIconProps) {
  const meta = getCategoryMetadata(categories, category)
  const IconComponent = getCategoryIcon(meta.icone)

  const sizeStyles = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-12 h-12 rounded-2xl",
    lg: "w-16 h-16 rounded-3xl"
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  }

  return (
    <div 
      className={cn(
        "relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
        sizeStyles[size],
        className
      )} 
      style={{ backgroundColor: variant === "ghost" ? `${meta.couleur}15` : meta.couleur }}
    >
      <div style={{ color: variant === "ghost" ? meta.couleur : "white" }}>
        <IconComponent className={iconSizes[size]} />
      </div>

      {showTypeIndicator && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background flex items-center justify-center font-bold shadow-sm",
          size === "sm" ? "w-3 h-3 text-[6px]" : "w-4 h-4 text-[8px]",
          showTypeIndicator === "income" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}>
          {showTypeIndicator === "income" ? "+" : "-"}
        </div>
      )}
    </div>
  )
}
