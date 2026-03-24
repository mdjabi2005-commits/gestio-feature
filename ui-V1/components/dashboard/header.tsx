"use client"

import { Plus, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  onAddTransaction: () => void
  apiStatus: "connected" | "disconnected" | "loading"
}

export function Header({ title, onAddTransaction, apiStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue sur votre tableau de bord financier
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* API Status */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
            apiStatus === "connected"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : apiStatus === "disconnected"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          )}
        >
          {apiStatus === "connected" ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>API Connectée</span>
            </>
          ) : apiStatus === "disconnected" ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>API Déconnectée</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span>Connexion...</span>
            </>
          )}
        </div>

        {/* Add Transaction Button */}
        <button
          onClick={onAddTransaction}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Plus className="relative w-4 h-4" />
          <span className="relative">Ajouter une transaction</span>
        </button>
      </div>
    </header>
  )
}
