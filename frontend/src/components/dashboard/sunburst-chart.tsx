"use client"

import React, { useState, useMemo } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryMetadata } from "@/lib/categories"
import { useFinancial } from "@/context/FinancialDataContext"

interface CategoryData {
  nom: string
  valeur: number
  montant?: number
  couleur: string
  icone: string
  enfants?: CategoryData[]
}

interface SunburstChartProps {
  data: CategoryData[]
  title?: string
}

export function SunburstChart({ data, title = "Répartition des dépenses" }: SunburstChartProps) {
  const { filterCategory, setFilterCategory } = useFinancial()
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)
  const [drillDownPath, setDrillDownPath] = useState<string[]>([])

  // Helper to lighten/darken hex colors
  const shadeColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)

    r = Math.floor(r * (100 + percent) / 100)
    g = Math.floor(g * (100 + percent) / 100)
    b = Math.floor(b * (100 + percent) / 100)

    r = Math.min(255, Math.max(0, r))
    g = Math.min(255, Math.max(0, g))
    b = Math.min(255, Math.max(0, b))

    const rr = r.toString(16).padStart(2, '0')
    const gg = g.toString(16).padStart(2, '0')
    const bb = b.toString(16).padStart(2, '0')

    return `#${rr}${gg}${bb}`
  }

  // Current level data based on path
  const levelData = useMemo(() => {
    if (drillDownPath.length === 0) return data
    
    let currentNodes = data
    let lastFound: CategoryData | null = null

    for (const name of drillDownPath) {
      const found = currentNodes.find(n => n.nom === name)
      if (found && found.enfants) {
        currentNodes = found.enfants
        lastFound = found
      }
    }
    return [...currentNodes].sort((a, b) => b.valeur - a.valeur)
  }, [data, drillDownPath])

  const processedData = useMemo(() => {
    return levelData.map((item, index) => {
      // Root level: colors come from backend (#10b981 for Revenu, #f43f5e for Dépense)
      if (drillDownPath.length === 0) {
        return { ...item, couleur: item.couleur || "#94a3b8" }
      }
      
      // Category level (depth 1): use our local styles
      const meta = getCategoryMetadata(data, item.nom)
      if (drillDownPath.length === 1 && meta.couleur !== "#94a3b8") {
        return { ...item, couleur: meta.couleur, icone: meta.icone }
      }

      // Sub-category level (depth 2+): derive from parent with gradient
      // Largest amount = darkest (-25%), each next item is +15% lighter
      const parentName = drillDownPath[drillDownPath.length - 1]
      const parentMeta = getCategoryMetadata(data, parentName)
      const shadePercent = -25 + (index * 15)
      return { 
        ...item, 
        couleur: shadeColor(parentMeta.couleur, shadePercent), 
        icone: parentMeta.icone 
      }
    })
  }, [levelData, data, drillDownPath])

  const total = useMemo(() => processedData.reduce((sum, item) => sum + item.valeur, 0), [processedData])

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, innerRadius: number = 0) => {
    const startRad = ((startAngle - 90) * Math.PI) / 180
    const endRad = ((endAngle - 90) * Math.PI) / 180

    const x1 = x + radius * Math.cos(startRad)
    const y1 = y + radius * Math.sin(startRad)
    const x2 = x + radius * Math.cos(endRad)
    const y2 = y + radius * Math.sin(endRad)

    const x3 = x + innerRadius * Math.cos(endRad)
    const y3 = y + innerRadius * Math.sin(endRad)
    const x4 = x + innerRadius * Math.cos(startRad)
    const y4 = y + innerRadius * Math.sin(startRad)

    const largeArc = endAngle - startAngle <= 180 ? 0 : 1

    return `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `
  }

  const segments = useMemo(() => {
    let currentAngle = 0
    return processedData.map((item) => {
      const angle = (item.valeur / (total || 1)) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const labelAngle = (startAngle + endAngle) / 2
      const labelRad = ((labelAngle - 90) * Math.PI) / 180
      const labelRadius = 88 
      const labelX = 120 + labelRadius * Math.cos(labelRad)
      const labelY = 120 + labelRadius * Math.sin(labelRad)

      return {
        ...item,
        startAngle,
        endAngle,
        labelX,
        labelY,
        labelAngle,
        pourcentage: (item.valeur / (total || 1)) * 100
      }
    })
  }, [processedData, total])

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
                             <button 
                                onClick={() => setDrillDownPath(drillDownPath.slice(0, i + 1))}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                             >
                                 {p}
                             </button>
                             {i < drillDownPath.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                         </div>
                     ))}
                 </div>
             )}
        </div>
        {drillDownPath.length > 0 && (
          <button 
            onClick={() => setDrillDownPath([])}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 text-indigo-400 hover:bg-secondary text-[10px] font-bold transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            RETOUR
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[380px] lg:h-[380px] group animate-in zoom-in-95 duration-700">
          <svg viewBox="0 0 260 260" className="w-full h-full drop-shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <g transform="translate(10, 10)">
              <circle cx="120" cy="120" r="50" className="fill-secondary/20 backdrop-blur-xl" />

              {segments.map((segment) => (
                <g key={segment.nom} className="animate-in fade-in zoom-in-95 duration-500">
                  <path
                    d={describeArc(120, 120, 115, segment.startAngle, segment.endAngle, 60)}
                    fill={segment.couleur}
                    className={cn(
                      "cursor-pointer transition-all duration-500",
                      hoveredSegment === segment.nom
                        ? "opacity-100 filter brightness-110 scale-[1.03] transform origin-[120px_120px]"
                        : (hoveredSegment) ? "opacity-30 shadow-none" : "opacity-90 hover:opacity-100"
                    )}
                    onMouseEnter={() => setHoveredSegment(segment.nom)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => {
                        if (segment.enfants && segment.enfants.length > 0) {
                            setDrillDownPath([...drillDownPath, segment.nom])
                            setFilterCategory(segment.nom)
                        } else {
                            setFilterCategory(filterCategory === segment.nom ? null : segment.nom)
                        }
                    }}
                  />
                  
                  {/* Labels on Slices */}
                  {(segment.endAngle - segment.startAngle > 15) && (
                    <g className="pointer-events-none overflow-visible">
                      <text
                        x={segment.labelX}
                        y={segment.labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-black text-[7px] drop-shadow-md pointer-events-none select-none"
                        style={{ 
                          opacity: hoveredSegment && hoveredSegment !== segment.nom ? 0.3 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        {segment.nom}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Central Information */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-background/40 backdrop-blur-2xl rounded-full w-24 h-24 sm:w-48 sm:h-48 flex flex-col items-center justify-center border border-white/5 shadow-2xl transition-all duration-500">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mb-1 px-4 truncate max-w-full font-bold">
                {drillDownPath.length > 0 ? drillDownPath[drillDownPath.length - 1] : (hoveredSegment ? 'Focus' : 'Total')}
              </span>
              <p className="text-sm sm:text-3xl font-black text-foreground tracking-tighter">
                {hoveredSegment ? (activeData?.pourcentage.toFixed(0) + '%') : (total.toLocaleString("fr-FR") + '€')}
              </p>
              {hoveredSegment && (
                <span className="text-[9px] sm:text-xs text-indigo-400 font-black px-2 mt-1 truncate max-w-full">
                  {hoveredSegment}
                </span>
              )}
              {!hoveredSegment && segments.some(s => s.enfants && s.enfants.length > 0) && (
                <span className="text-[9px] text-indigo-400/60 mt-2 uppercase tracking-[0.2em] font-black animate-pulse">CLIC DÉTAILS</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


