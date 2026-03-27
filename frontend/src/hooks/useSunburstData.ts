"use client"
import { useState, useMemo } from "react"
import { getCategoryMetadata } from "@/lib/categories"
import { shadeColor } from "@/lib/chart-utils"

export interface CategoryData {
  nom: string
  valeur: number
  montant?: number
  couleur: string
  icone: string
  enfants?: CategoryData[]
}

export function useSunburstData(data: CategoryData[]) {
  const [drillDownPath, setDrillDownPath] = useState<string[]>([])
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const levelData = useMemo(() => {
    if (drillDownPath.length === 0) return data
    let currentNodes = data
    for (const name of drillDownPath) {
      const found = currentNodes.find(n => n.nom === name)
      if (found && found.enfants) currentNodes = found.enfants
    }
    return [...currentNodes].sort((a, b) => b.valeur - a.valeur)
  }, [data, drillDownPath])

  const processedData = useMemo(() => {
    return levelData.map((item, index) => {
      if (drillDownPath.length === 0) return { ...item, couleur: item.couleur || "#94a3b8" }
      const meta = getCategoryMetadata(data, item.nom)
      if (drillDownPath.length === 1 && meta.couleur !== "#94a3b8") return { ...item, couleur: meta.couleur, icone: meta.icone }
      const parentMeta = getCategoryMetadata(data, drillDownPath[drillDownPath.length - 1])
      return { ...item, couleur: shadeColor(parentMeta.couleur, -25 + (index * 15)), icone: parentMeta.icone }
    })
  }, [levelData, data, drillDownPath])

  const total = useMemo(() => processedData.reduce((sum, item) => sum + item.valeur, 0), [processedData])

  const segments = useMemo(() => {
    let currentAngle = 0
    return processedData.map((item) => {
      const angle = (item.valeur / (total || 1)) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      const labelRad = (((startAngle + endAngle) / 2) - 90) * Math.PI / 180
      return {
        ...item, startAngle, endAngle,
        labelX: 120 + 88 * Math.cos(labelRad),
        labelY: 120 + 88 * Math.sin(labelRad),
        pourcentage: (item.valeur / (total || 1)) * 100
      }
    })
  }, [processedData, total])

  return { drillDownPath, setDrillDownPath, hoveredSegment, setHoveredSegment, segments, total }
}
