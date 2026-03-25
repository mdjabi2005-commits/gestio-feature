import React from 'react';
import { Check, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScannedTicket } from '@/api';
import { Button } from '@/components/ui/button';

interface BatchReviewProps {
  results: ScannedTicket[];
  onValidate: (index: number) => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function BatchReview({ results, onValidate, onEdit, onRemove }: BatchReviewProps) {
  if (results.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit mb-2 animate-in fade-in slide-in-from-bottom-2">
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {results.length} ticket(s) en attente de validation
        </span>
      </div>
      
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto custom-scrollbar pointer-events-auto p-1">
        {results.map((result, idx) => (
          <div 
            key={idx}
            className="group relative glass-card p-4 rounded-2xl border border-white/10 hover:border-indigo-500/30 transition-all duration-300 animate-in slide-in-from-right-10"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {result.result.transaction.description || "Achat"}
                  </span>
                  {result.result.warnings.length > 0 && (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {result.result.transaction.montant?.toFixed(2)}€
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 font-medium">
                    {result.result.transaction.categorie}
                  </span>
                  <span className="text-white/40 italic">
                    {new Date(result.result.transaction.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(idx)}
                  className="w-8 h-8 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(idx)}
                  className="w-8 h-8 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => onValidate(idx)}
                  className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
