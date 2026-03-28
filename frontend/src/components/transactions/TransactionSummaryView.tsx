import React from 'react';
import { cn } from '@/lib/utils';

interface TransactionSummaryViewProps {
  type: 'depense' | 'revenu';
  amount: string;
  description: string;
  category: string;
  subcategory: string;
  date: string;
}

export const TransactionSummaryView: React.FC<TransactionSummaryViewProps> = ({
  type,
  amount,
  description,
  category,
  subcategory,
  date,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold text-white font-mono">
          {type === 'depense' ? '-' : '+'}{amount}€
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
          type === 'revenu' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
        )}>
          {type}
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{description || '(Sans description)'}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-500 mb-1">Catégorie</p>
          <p className="font-semibold text-white">{category} › {subcategory || '-'}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="font-semibold text-white">
            {new Date(date).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
