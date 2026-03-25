import { Plus, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  onAddTransaction: () => void
  onScanClick: () => void
  apiStatus: "connected" | "disconnected" | "loading"
}

export function Header({ title, onAddTransaction, onScanClick, apiStatus }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-2.5 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Title */}
      <div className="min-w-0 flex-1 mr-4">
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* API Status — compact dot + label */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300",
            apiStatus === "connected"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : apiStatus === "disconnected"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          )}
        >
          {apiStatus === "loading" ? (
            <div className="w-2 h-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          ) : (
            <div className={cn("w-2 h-2 rounded-full", apiStatus === "connected" ? "bg-emerald-400" : "bg-red-400")} />
          )}
          <span className="hidden sm:inline">Réseau</span>
        </div>

        {/* Scanner — icon only */}
        <button
          onClick={onScanClick}
          title="Scanner un ticket"
          className="group relative flex items-center justify-center w-9 h-9 rounded-xl text-indigo-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-200 hover:scale-[1.04] active:scale-95"
        >
          <ScanLine className="w-4 h-4" />
        </button>

        {/* Add Transaction — compact */}
        <button
          onClick={onAddTransaction}
          title="Ajouter une transaction"
          className="group relative flex items-center gap-2 pl-2.5 pr-4 h-9 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] hover:shadow-lg hover:shadow-indigo-500/25"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
          <Plus className="relative w-4 h-4" />
          <span className="relative">Ajouter</span>
        </button>
      </div>
    </header>
  )
}
