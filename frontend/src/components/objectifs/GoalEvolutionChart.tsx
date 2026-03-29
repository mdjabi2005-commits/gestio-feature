"use client"

import React, { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp } from "lucide-react"
import type { GoalMonthlyProgress } from "@/api"

interface GoalEvolutionChartProps {
  data: GoalMonthlyProgress[]
  title?: string
  showLegend?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-bold text-white/60">
                {entry.name === "theoretical" ? "Théorique" : "Réel"}
              </span>
            </div>
            <span className="text-sm font-black text-white tabular-nums">
              {entry.value?.toLocaleString("fr-FR")}€
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function GoalEvolutionChart({
  data,
  title = "Évolution mensuelle",
  showLegend = true,
}: GoalEvolutionChartProps) {
  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      monthLabel: new Date(item.month + "-01").toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      }),
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl">
        <TrendingUp className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Pas assez de données
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {title}
          </h3>
        </div>
      )}

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="theoreticalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="realGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="monthLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickFormatter={(value) => `${value}€`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                    {value === "theoretical" ? "Théorique (Plan)" : "Réel (Transactions)"}
                  </span>
                )}
              />
            )}
            <Area
              type="monotone"
              dataKey="theoretical"
              name="theoretical"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#theoreticalGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1", stroke: "#0a0a0c", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="real"
              name="real"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#realGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#10b981", stroke: "#0a0a0c", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
