"use client"
import React from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFinancial } from "@/context/FinancialDataContext"
import { describeArc } from "@/lib/chart-utils"
import { useSunburstData, type CategoryData } from "@/hooks/useSunburstData"

interface SunburstChartProps {
  data: CategoryData[]
  title?: string
}

export function SunburstChart({ data, title = "Répartition des dépenses" }: SunburstChartProps) {
  const { filterCategory, setFilterCategory } = useFinancial()
  const { drillDownPath, setDrillDownPath, hoveredSegment, setHoveredSegment, segments, total } = useSunburstData(data)
  const activeData = segments.find(s => s.nom === hoveredSegment)

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden relative select-none">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider opacity-60 shrink-0">{title}</h3>
          {drillDownPath.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden pointer-events-auto">
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              {drillDownPath.map((p, i) => (
                <div key={p} className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setDrillDownPath(drillDownPath.slice(0, i + 1))} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                    {p}
                  </button>
                  {i < drillDownPath.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          )}
        </div>
        {drillDownPath.length > 0 && (
          <button onClick={() => setDrillDownPath([])} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 text-indigo-400 hover:bg-secondary text-[10px] font-bold">
            <ArrowLeft className="w-3 h-3" /> RETOUR
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <div className="relative w-full aspect-square max-h-full group animate-in zoom-in-95 duration-700 max-w-[400px]">
          <svg viewBox="0 0 260 260" className="w-full h-full drop-shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <g transform="translate(10, 10)">
              <circle cx="120" cy="120" r="50" className="fill-secondary/20 backdrop-blur-xl" />
              {segments.map((segment) => (
                <g key={segment.nom}>
                  <path
                    d={describeArc(120, 120, 115, segment.startAngle, segment.endAngle, 60)}
                    fill={segment.couleur}
                    className={cn("cursor-pointer transition-all duration-500", hoveredSegment === segment.nom ? "filter brightness-110 scale-[1.03] origin-[120px_120px]" : hoveredSegment ? "opacity-30" : "opacity-90 hover:opacity-100")}
                    onMouseEnter={() => setHoveredSegment(segment.nom)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => segment.enfants?.length ? (setDrillDownPath([...drillDownPath, segment.nom]), setFilterCategory(segment.nom)) : setFilterCategory(filterCategory === segment.nom ? null : segment.nom)}
                  />
                  {segment.endAngle - segment.startAngle > 15 && (
                    <text x={segment.labelX} y={segment.labelY} textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-[7px] drop-shadow-md pointer-events-none select-none transition-opacity" style={{ opacity: hoveredSegment && hoveredSegment !== segment.nom ? 0.3 : 1 }}>
                      {segment.nom}
                    </text>
                  )}
                </g>
              ))}
            </g>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/40 backdrop-blur-2xl rounded-full w-1/2 aspect-square flex flex-col items-center justify-center border border-white/5 shadow-2xl transition-all">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mb-1 px-4 truncate max-w-full font-bold">
                {drillDownPath.length > 0 ? drillDownPath[drillDownPath.length - 1] : (hoveredSegment ? 'Focus' : 'Total')}
              </span>
              <p className="text-sm sm:text-3xl font-black text-foreground tracking-tighter">
                {hoveredSegment ? (activeData?.pourcentage.toFixed(0) + '%') : (total.toLocaleString("fr-FR") + '€')}
              </p>
              {hoveredSegment && <span className="text-[9px] sm:text-xs text-indigo-400 font-black px-2 mt-1 truncate max-w-full">{hoveredSegment}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
