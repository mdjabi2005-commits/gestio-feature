"use client"
import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface TransactionRowEditProps {
  transaction: {
    id?: number
    type: "depense" | "revenu"
    description?: string
    montant: number
    categorie: string
    sous_categorie?: string
    date: string
    objectif_id?: number
  }
  categoriesYaml: any[]
  objectifs: any[]
  isSelected: boolean
  onSelect: (id: number, selected: boolean) => void
  onUpdate: (id: number, data: any) => void
}

export function TransactionRowEdit({
  transaction,
  categoriesYaml,
  objectifs,
  isSelected,
  onSelect,
  onUpdate,
}: TransactionRowEditProps) {
  return (
    <div className="group flex items-center gap-4 px-6 py-3 bg-indigo-500/5 border-b border-indigo-500/20 animate-in fade-in duration-300">
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={(val) => onSelect(transaction.id!, !!val)}
        className="border-indigo-500/30 data-[state=checked]:bg-indigo-500"
      />
      
      <div className="flex-1 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-2">
          <Input 
            type="date" 
            value={transaction.date.split('T')[0]} 
            onChange={(e) => onUpdate(transaction.id!, { date: e.target.value })}
            className="h-10 text-xs bg-background/50 border-white/10 px-2"
          />
        </div>
        
        <div className="col-span-1">
          <select 
            value={transaction.type}
            onChange={(e) => onUpdate(transaction.id!, { type: e.target.value })}
            className="w-full h-10 text-[11px] font-black uppercase bg-background/50 border border-white/10 rounded-md px-1 outline-none"
          >
            <option value="revenu">REV</option>
            <option value="depense">DEP</option>
          </select>
        </div>
        
        <div className="col-span-2">
          <select 
            value={transaction.categorie}
            onChange={(e) => {
              const newCat = e.target.value;
              const subs = categoriesYaml.find((c: any) => c.name === newCat)?.subcategories || [];
              onUpdate(transaction.id!, { 
                categorie: newCat, 
                sous_categorie: subs.length > 0 ? subs[0] : "" 
              });
            }}
            className="w-full h-10 text-xs font-bold bg-background/50 border border-white/10 rounded-md px-2 outline-none"
          >
            {categoriesYaml.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        
        <div className="col-span-2">
          <select 
            value={transaction.sous_categorie || ""}
            onChange={(e) => onUpdate(transaction.id!, { sous_categorie: e.target.value })}
            className="w-full h-10 text-xs bg-background/50 border border-white/10 rounded-md px-2 outline-none"
          >
            <option value="">(Aucune)</option>
            {(categoriesYaml.find((c: any) => c.name === transaction.categorie)?.subcategories || []).map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        
        <div className="col-span-1">
          <Input 
            type="number" 
            value={transaction.montant} 
            onChange={(e) => onUpdate(transaction.id!, { montant: parseFloat(e.target.value) })}
            className="h-10 text-xs font-black text-right border-white/10 px-2"
          />
        </div>
        
        <div className="col-span-2">
          <Input 
            value={transaction.description || ""} 
            placeholder="Notes..."
            onChange={(e) => onUpdate(transaction.id!, { description: e.target.value })}
            className="h-10 text-xs font-medium bg-background/50 border-white/10"
          />
        </div>
        
        <div className="col-span-2">
          <select 
            value={transaction.objectif_id || ""}
            onChange={(e) => onUpdate(transaction.id!, { objectif_id: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full h-10 text-[11px] bg-background/50 border border-white/10 rounded-md px-1 outline-none font-bold"
          >
            <option value="">Aucun objectif</option>
            {objectifs.map((o: any) => <option key={o.id} value={o.id}>🎯 {o.nom}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
