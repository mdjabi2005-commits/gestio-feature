import { Plus, ScanLine, Calendar, PieChart, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  onAddTransaction: () => void
  onScanClick: () => void
  onAddEcheance: () => void
  onAddBudget: () => void
  onAddGoal: () => void
  apiStatus: "connected" | "disconnected" | "loading"
}

export function Header({ 
  title, onAddTransaction, onScanClick, 
  onAddEcheance, onAddBudget, onAddGoal, 
  apiStatus 
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-2 bg-background/80 backdrop-blur-xl border-b border-border">
      {/* Title */}
      <div className="min-w-0 flex-1 mr-4">
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* API Status */}
        <div className={cn(
          "hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 mr-2",
          apiStatus === "connected" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
          apiStatus === "disconnected" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
          "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
           <div className={cn("w-1.5 h-1.5 rounded-full", apiStatus === "connected" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400")} />
           <span>Réseau</span>
        </div>

        {/* Action Group */}
        <div className="flex items-center bg-white/[0.03] border border-white/5 p-1 rounded-2xl gap-1">
          {/* Scanner */}
          <ActionButton onClick={onScanClick} title="Scanner" icon={<ScanLine className="w-4 h-4" />} color="text-indigo-400" bgColor="hover:bg-indigo-500/10" />
          
          {/* Calendar (Échéance) */}
          <ActionButton onClick={onAddEcheance} title="Échéance" icon={<Calendar className="w-4 h-4" />} color="text-emerald-400" bgColor="hover:bg-emerald-500/10" />
          
          {/* PieChart (Budget) */}
          <ActionButton onClick={onAddBudget} title="Budget" icon={<PieChart className="w-4 h-4" />} color="text-amber-400" bgColor="hover:bg-amber-500/10" />
          
          {/* Target (Objectif) */}
          <ActionButton onClick={onAddGoal} title="Objectif" icon={<Target className="w-4 h-4" />} color="text-rose-400" bgColor="hover:bg-rose-500/10" />

          {/* Add Transaction Main Button */}
          <button
            onClick={onAddTransaction}
            title="Ajouter une transaction"
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl font-bold text-white overflow-hidden transition-all duration-200 hover:scale-[1.05] active:scale-95 ml-1 shadow-lg shadow-indigo-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500" />
            <Plus className="relative w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

function ActionButton({ onClick, title, icon, color, bgColor }: { onClick: () => void, title: string, icon: React.ReactNode, color: string, bgColor: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-[1.08] active:scale-90",
        color, bgColor
      )}
    >
      {icon}
    </button>
  )
}
