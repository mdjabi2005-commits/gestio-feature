

import { Plus, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  onAddTransaction: () => void
  onScanClick: () => void
  apiStatus: "connected" | "disconnected" | "loading"
}

export function Header({ title, onAddTransaction, onScanClick, apiStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Title */}
      <div className="min-w-0 flex-1 mr-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
        <p className="text-xs md:text-sm text-muted-foreground truncate opacity-70">
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
              <span className="hidden sm:inline">API Connectée</span>
            </>
          ) : apiStatus === "disconnected" ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">API Déconnectée</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span className="hidden sm:inline">Connexion...</span>
            </>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={onScanClick}
          className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] bg-white/5 border border-white/10"
        >
          <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
          <svg className="relative w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /><path d="M12 7v10" />
          </svg>
          <span className="relative hidden md:inline">Scanner</span>
        </button>

        {/* Add Transaction Button (Compact) */}
        <button
          onClick={onAddTransaction}
          className="group relative flex items-center justify-center w-10 h-10 sm:w-auto sm:px-5 rounded-xl font-medium text-sm text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
          title="Ajouter une transaction"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Plus className="relative w-5 h-5" />
          <span className="relative hidden sm:inline ml-2">Ajouter</span>
        </button>
      </div>
    </header>
  )
}
