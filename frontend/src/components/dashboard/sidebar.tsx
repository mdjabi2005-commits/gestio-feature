

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowLeftRight,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Target,
} from "lucide-react"

interface SidebarProps {
  // No longer needs props as it uses usePathname()
}

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "transactions", href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "echeances", href: "/echeances", label: "Échéances", icon: RefreshCw },
  { id: "budgets", href: "/budgets", label: "Budgets", icon: Wallet },
  { id: "objectifs", href: "/objectifs", label: "Objectifs", icon: Target },
  { id: "settings", href: "/settings", label: "Paramètres", icon: Settings },
]

export function Sidebar({}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border overflow-hidden">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-accent shadow-lg shadow-indigo-500/10 border border-white/5 overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Gestio V4
            </span>
            <span className="text-xs text-muted-foreground">Finance Manager</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 text-foreground border border-indigo-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive
                    ? "text-indigo-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 transition-all duration-300",
          isCollapsed ? "justify-center p-2" : "justify-start"
        )}>
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-card shadow-inner">
               <img src="/logo.png" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-sidebar shadow-sm" />
          </div>
        </div>
      </div>
    </aside>
  )
}
