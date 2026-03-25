"use client"

import React, { useMemo } from "react"
import { useFinancial } from "@/context/FinancialDataContext"
import { toast } from "sonner"
import createPlotlyComponent from 'react-plotly.js/factory'
// @ts-ignore
import Plotly from 'plotly.js-dist-min'

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
  const { filteredTransactions, filterCategory, setFilterDateRange } = useFinancial()

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Monthly Aggregation
  const monthlyData = useMemo(() => {
    const months: Record<string, { key: string, label: string, revenu: number, depense: number, cumulative: number, net: number, count: number }> = {}
    
    const sortedDaily = [...data].sort((a,b) => a.date.localeCompare(b.date))

    sortedDaily.forEach(d => {
      const date = new Date(d.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) {
        months[key] = { 
          key,
          label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          revenu: 0, depense: 0, cumulative: 0, net: 0, count: 0
        }
      }
      months[key].revenu += d.revenu
      months[key].depense += d.depense
      months[key].cumulative = d.balance
    })

    // Calculate Net monthly balance (Income - Expense)
    Object.values(months).forEach(m => {
      m.net = m.revenu - m.depense
    })

    // Count operations
    filteredTransactions.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (months[key]) months[key].count++
    })

    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([_, v]) => v)
  }, [data, filteredTransactions])

  const xVals = monthlyData.map(m => m.label)
  const revenuVals = monthlyData.map(m => m.revenu)
  const depenseVals = monthlyData.map(m => m.depense)
  const soldeVals = monthlyData.map(m => m.cumulative)
  
  const headerContext = filterCategory ? `· ${filterCategory}` : ''

  const handleMonthClick = (label: string) => {
    const targetMonth = monthlyData.find(m => m.label === label)
    if (targetMonth) {
      const { key } = targetMonth
      const [year, month] = key.split('-').map(Number)
      const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = formatLocalDate(new Date(year, month, 0))
      setFilterDateRange({ start: firstDay, end: lastDay })
      toast.success(`Filtré sur ${label}`, {
        description: "Les transactions et données ont été mises à jour."
      })
    }
  }

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden bg-[#1E1E1E]/40 rounded-xl border border-border/50">
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
         <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title} {headerContext}</h3>
      </div>
      <div className="flex-1 w-full h-full min-h-0">
        <Plot
          data={[
            {
              type: 'bar',
              name: 'Revenus',
              x: xVals,
              y: revenuVals,
              marker: {
                color: '#00D4AA',
                line: { color: '#00A87E', width: 1.5 }
              },
              hovertemplate: '<b>%{x}</b><br>Revenus: %{y:,.0f} €<extra></extra>'
            },
            {
              type: 'bar',
              name: 'Dépenses',
              x: xVals,
              y: depenseVals,
              marker: {
                color: '#FF6B6B',
                line: { color: '#CC5555', width: 1.5 }
              },
              hovertemplate: '<b>%{x}</b><br>Dépenses: %{y:,.0f} €<extra></extra>'
            },
            {
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Solde',
              x: xVals,
              y: soldeVals,
              line: { color: '#4A90E2', width: 3 },
              marker: { size: 8, color: '#4A90E2', line: { color: '#1E1E1E', width: 2 } },
              hovertemplate: '<b>%{x}</b><br>Solde: %{y:+,.0f} €<extra></extra>'
            }
          ]}
          layout={{
            font: { color: '#888888' },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            hovermode: 'x unified',
            barmode: 'group',
            margin: { t: 50, b: 60, l: 50, r: 20 },
            legend: {
              orientation: "h",
              yanchor: "bottom",
              y: -0.25,
              xanchor: "center",
              x: 0.5,
              font: { size: 11, color: "#888888" },
              bgcolor: "rgba(0,0,0,0)",
            },
            xaxis: {
              showgrid: false,
              color: '#888888',
              tickangle: -30,
              tickfont: { size: 10 },
              automargin: true,
              fixedrange: true // Prevent zooming on x if desired, or keep it true for mobile
            },
            yaxis: {
              title: { text: 'Montant (€)' },
              showgrid: true,
              gridcolor: 'rgba(128,128,128,0.1)',
              zeroline: true,
              zerolinewidth: 2,
              zerolinecolor: 'rgba(128,128,128,0.3)',
              color: '#888888',
              tickfont: { size: 10 },
            },
            autosize: true
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
          config={{
            displayModeBar: false,
            responsive: true
          }}
          onClick={(data) => {
            if (data.points && data.points.length > 0) {
              const xValue = data.points[0].x as string;
              handleMonthClick(xValue);
            }
          }}
        />
      </div>
    </div>
  )
}
