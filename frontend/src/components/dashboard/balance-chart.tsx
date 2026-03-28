"use client"

import React, { useMemo } from "react"
import { useFinancial } from "@/context/FinancialDataContext"
import createPlotlyComponent from 'react-plotly.js/factory'
// @ts-ignore
import Plotly from 'plotly.js-dist-min'
import { MousePointer2 } from "lucide-react"

const Plot = createPlotlyComponent(Plotly)

interface BalanceDataPoint {
  date: string
  balance: number
  revenu: number
  depense: number
}

interface BalanceChartProps {
  data: BalanceDataPoint[]
  title?: string
}

export function BalanceChart({ data, title = "Évolution Mensuelle" }: BalanceChartProps) {
  const { filterMonths, toggleMonth, filterCategories } = useFinancial()

  // Monthly Aggregation
  const monthlyData = useMemo(() => {
    const months: Record<string, { key: string, label: string, revenu: number, depense: number, cumulative: number }> = {}
    const sortedDaily = [...data].sort((a,b) => a.date.localeCompare(b.date))

    sortedDaily.forEach(d => {
      const date = new Date(d.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) {
        months[key] = { 
          key,
          label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          revenu: 0, depense: 0, cumulative: 0
        }
      }
      months[key].revenu += d.revenu
      months[key].depense += d.depense
      months[key].cumulative = d.balance
    })

    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([_, v]) => v)
  }, [data])

  const xVals = monthlyData.map(m => m.label)
  const revenuVals = monthlyData.map(m => m.revenu)
  const depenseVals = monthlyData.map(m => m.depense)
  const soldeVals = monthlyData.map(m => m.cumulative)
  
  // Highlight logic for Plotly
  const selectedIndices = monthlyData.map((m, i) => filterMonths.includes(m.key) ? i : -1).filter(i => i !== -1)
  
  const headerContext = filterCategories.length > 0 ? `· ${filterCategories.join(', ')}` : ''

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-background/20 rounded-xl border border-border/50 group/chart">
      <div className="absolute top-4 left-6 z-10 flex items-center justify-between w-[calc(100%-24px)]">
         <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title} {headerContext}</h3>
         <div className="flex items-center gap-1.5 opacity-0 group-hover/chart:opacity-100 transition-opacity pr-8">
            <MousePointer2 className="w-3 h-3 text-indigo-400 rotate-12" />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Cliquez sur un mois pour filtrer</span>
         </div>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        <Plot
          data={[
            {
              type: 'bar',
              name: 'Revenus',
              x: xVals,
              y: revenuVals,
              customdata: monthlyData.map(m => m.key),
              marker: {
                color: monthlyData.map(m => filterMonths.includes(m.key) ? '#10b981' : '#00D4AA40'),
                line: { color: '#10b981', width: 1 }
              },
              hovertemplate: '<b>%{x}</b><br>Revenus: %{y:,.0f} €<br><b>CLIQUEZ POUR FILTRER</b><extra></extra>'
            },
            {
              type: 'bar',
              name: 'Dépenses',
              x: xVals,
              y: depenseVals,
              customdata: monthlyData.map(m => m.key),
              marker: {
                color: monthlyData.map(m => filterMonths.includes(m.key) ? '#f43f5e' : '#FF6B6B40'),
                line: { color: '#ec4899', width: 1 }
              },
              hovertemplate: '<b>%{x}</b><br>Dépenses: %{y:,.0f} €<br><b>CLIQUEZ POUR FILTRER</b><extra></extra>'
            },
            {
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Solde',
              x: xVals,
              y: soldeVals,
              customdata: monthlyData.map(m => m.key),
              line: { color: '#6366f1', width: 3, shape: 'spline' },
              marker: { 
                size: 10, 
                color: monthlyData.map(m => filterMonths.includes(m.key) ? '#818cf8' : '#6366f120'),
                line: { color: '#6366f1', width: 2 } 
              },
              hovertemplate: '<b>%{x}</b><br>Solde: %{y:+,.0f} €<br><b>CLIQUEZ POUR FILTRER</b><extra></extra>'
            }
          ]}
          layout={{
            font: { color: '#888888', family: "'Inter', sans-serif" },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            hovermode: 'x unified',
            barmode: 'group',
            margin: { t: 60, b: 50, l: 40, r: 20 },
            legend: {
              orientation: "h",
              yanchor: "bottom",
              y: -0.3,
              xanchor: "center",
              x: 0.5,
              font: { size: 9, color: "#888888" },
              bgcolor: "rgba(0,0,0,0)",
            },
            xaxis: {
              showgrid: false,
              color: '#888888',
              tickfont: { size: 9, weight: 'bold' },
              automargin: true,
              fixedrange: true
            },
            yaxis: {
              showgrid: true,
              gridcolor: 'rgba(128,128,128,0.05)',
              zeroline: true,
              zerolinecolor: 'rgba(128,128,128,0.2)',
              color: '#888888',
              tickfont: { size: 9 },
              fixedrange: true
            },
            autosize: true
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
          config={{ displayModeBar: false, responsive: true, scrollZoom: false }}
          onClick={(dataPoint) => {
            if (dataPoint.points && dataPoint.points.length > 0) {
              const monthKey = dataPoint.points[0].customdata as string;
              if (monthKey) toggleMonth(monthKey);
            }
          }}
        />
      </div>
    </div>
  )
}
