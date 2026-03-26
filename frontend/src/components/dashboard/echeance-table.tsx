"use client";

import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface Echeance {
  id: number;
  nom: string;
  montant: number;
  date_prevue: string;
  categorie: string;
  type: 'Dépense' | 'Revenu';
  status: 'pending' | 'paid' | 'overdue';
}

interface EcheanceTableProps {
  echeances: Echeance[];
  loading?: boolean;
}

export function EcheanceTable({ echeances, loading }: EcheanceTableProps) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'overdue': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (echeances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-40">
        <Calendar className="w-8 h-8" />
        <p className="text-sm font-medium">Aucune échéance à venir ce mois-ci</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-none">
      {echeances.map((e) => (
        <div 
          key={e.id} 
          className="group glass-card bg-white/[0.02] border-white/5 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2 rounded-lg border",
              e.type === 'Revenu' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                {e.nom}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {new Date(e.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-[8px] opacity-20 text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground lowercase">{e.categorie}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={cn(
              "text-sm font-black tracking-tight",
              e.type === 'Revenu' ? "text-emerald-400" : "text-foreground"
            )}>
              {e.type === 'Revenu' ? '+' : '-'}{fmt(e.montant)}
            </p>
            <div className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest mt-1",
              getStatusStyle(e.status)
            )}>
              {e.status === 'paid' ? 'Payé' : e.status === 'overdue' ? 'Retard' : 'À venir'}
            </div>
          </div>
        </div>
      ))}

      <Link href="/echeances" className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:border-white/20 hover:text-foreground transition-all flex items-center justify-center gap-2 mt-2">
        Gérer toutes les échéances
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
