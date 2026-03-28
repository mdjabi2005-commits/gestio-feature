"use client"
import React, { useState, useRef } from "react"
import { ArrowLeft, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFinancial } from "@/context/FinancialDataContext"
import { describeArc } from "@/lib/chart-utils"
import { useSunburstData, type CategoryData } from "@/hooks/useSunburstData"

interface SunburstChartProps {
  data: CategoryData[]
  title?: string
}

export function SunburstChart({ data, title = "Répartition des dépenses" }: SunburstChartProps) {
  const { filterCategories, toggleCategory, isSunburstSynced, setIsSunburstSynced } = useFinancial()
  const { drillDownPath, setDrillDownPath, hoveredSegment, setHoveredSegment, segments, total } = useSunburstData(data)
  const activeData = segments.find(s => s.nom === hoveredSegment)
  
  const clickTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleSegmentClick = (segment: any) => {
    const isType = segment.nom === "depense" || segment.nom === "revenu";
    const hasSingleChild = segment.enfants?.length === 1;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
      
      // Double click: Select entire category/segment
      toggleCategory(segment.nom)
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null
        // Single click:
        if (segment.enfants?.length) {
          // Drill down
          setDrillDownPath([...drillDownPath, segment.nom])
          
          // Special case: if exactly 1 child, filter by that child immediately
          if (hasSingleChild && !isType) {
            toggleCategory(segment.enfants[0].nom)
          }
        } else {
          // Filter for leaf categories OR root types if no children
          toggleCategory(segment.nom)
        }
      }, 250)
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden relative select-none">
      <div className="flex items-center justify-between mb-4 shrink-0 px-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider opacity-60 shrink-0">{title}</h3>
          {drillDownPath.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden">
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              {drillDownPath.map((p, i) => (
                <div key={p} className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setDrillDownPath(drillDownPath.slice(0, i + 1))} className="text-[10px] font-bold text-indigo-400 hover:underline">
                    {p}
                  </button>
                  {i < drillDownPath.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div 
              onClick={() => setIsSunburstSynced(!isSunburstSynced)}
              className={cn(
                "w-8 h-4 rounded-full transition-all duration-300 relative border",
                isSunburstSynced ? "bg-indigo-500 border-indigo-400" : "bg-secondary border-border"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 shadow-sm",
                isSunburstSynced ? "left-4.5" : "left-0.5"
              )} />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter group-hover:text-foreground transition-colors">Sync Période</span>
          </label>

          {drillDownPath.length > 0 && (
            <button onClick={() => setDrillDownPath([])} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/30 text-indigo-400 hover:bg-secondary text-[9px] font-bold transition-all border border-border/10">
              <ArrowLeft className="w-2.5 h-2.5" /> RETOUR
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <div className="relative w-full aspect-square max-h-full group animate-in zoom-in-95 duration-700 max-w-[360px]">
          <svg viewBox="0 0 260 260" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <g transform="translate(10, 10)">
              <circle cx="120" cy="120" r="50" className="fill-secondary/10 backdrop-blur-xl" />
              {segments.map((segment) => {
                const isActive = filterCategories.includes(segment.nom)
                return (
                  <g key={segment.nom}>
                    <path
                      d={describeArc(120, 120, 115, segment.startAngle, segment.endAngle, 60)}
                      fill={segment.couleur}
                      className={cn(
                        "cursor-pointer transition-all duration-500",
                        hoveredSegment === segment.nom ? "filter brightness-125 scale-[1.03] origin-[120px_120px]" : 
                        (hoveredSegment ? "opacity-20" : isActive ? "opacity-100 ring-2 ring-white/50" : "opacity-80 hover:opacity-100")
                      )}
                      onMouseEnter={() => setHoveredSegment(segment.nom)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      onClick={() => handleSegmentClick(segment)}
                    />
                    {segment.endAngle - segment.startAngle > 15 && (
                      <text x={segment.labelX} y={segment.labelY} textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-[7px] drop-shadow-md pointer-events-none select-none transition-opacity" style={{ opacity: hoveredSegment && hoveredSegment !== segment.nom ? 0.3 : 1 }}>
                        {segment.nom}
                      </text>
                    )}
                    {isActive && (
                       <circle 
                        cx={segment.labelX} 
                        cy={segment.labelY + 8} 
                        r="1.5" 
                        className="fill-white animate-pulse" 
                       />
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/40 backdrop-blur-2xl rounded-full w-[45%] aspect-square flex flex-col items-center justify-center border border-white/5 shadow-2xl transition-all">
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest mb-1 px-4 truncate max-w-full font-bold">
                {drillDownPath.length > 0 ? drillDownPath[drillDownPath.length - 1] : (hoveredSegment ? 'Focus' : 'Total')}
              </span>
              <p className="text-2xl font-black text-foreground tracking-tighter leading-none">
                {hoveredSegment ? (activeData?.pourcentage.toFixed(0) + '%') : (total.toLocaleString("fr-FR") + '€')}
              </p>
              {hoveredSegment && <span className="text-[8px] text-indigo-400 font-black px-2 mt-1 truncate max-w-full uppercase">{hoveredSegment}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
