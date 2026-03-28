import React, { useState, useRef } from "react"
import { X, Save, Calendar, Repeat, Paperclip, Loader2, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentSection } from "../transactions/AttachmentSection"
import { CategorySubcategorySelect } from "@/components/ui/CategorySubcategorySelect"
import type { Attachment } from "@/api"

import { useFinancial } from "@/context/FinancialDataContext"

interface InstallmentFormData {
  nom: string
  type: "depense" | "revenu"
  categorie: string
  sous_categorie: string
  montant: string
  frequence: string
  date_debut: string
  date_fin: string
  description: string
  objectif_id?: number | null
}

const FREQUENCIES = ["mensuelle", "hebdomadaire", "annuelle", "trimestrielle", "bimensuelle"]

const FIELD_CLASS = "w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.12] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-all appearance-none"
const LABEL_CLASS = "block text-xs font-medium text-white/50 mb-1"

export function InstallmentForm({
  initial, onSave, onCancel,
  attachments = [], onUpload, onDelete, isUploading = false, isDeletingId = null
}: {
  initial?: Partial<InstallmentFormData>
  onSave: (data: InstallmentFormData) => void
  onCancel: () => void
  attachments?: Attachment[]
  onUpload?: (file: File) => void
  onDelete?: (id: number) => void
  isUploading?: boolean
  isDeletingId?: number | null
}) {
  const [form, setForm] = useState<InstallmentFormData>({
    nom: initial?.nom ?? "",
    type: initial?.type ?? "depense",
    categorie: initial?.categorie ?? "Alimentation",
    sous_categorie: initial?.sous_categorie ?? "",
    montant: initial?.montant ?? "",
    frequence: initial?.frequence ?? "mensuelle",
    date_debut: initial?.date_debut ?? "",
    date_fin: initial?.date_fin ?? "",
    description: initial?.description ?? "",
    objectif_id: initial?.objectif_id ?? null,
  })

  const { objectifs, showFinishedGoals } = useFinancial();
  const visibleObjectifs = React.useMemo(() => {
    if (showFinishedGoals) return objectifs;
    return objectifs.filter(o => (o.montant_actuel || 0) < (o.montant_cible || 0));
  }, [objectifs, showFinishedGoals]);

  const fileInputRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof InstallmentFormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const isValid = form.nom.trim() && form.montant && Number(form.montant) > 0 && form.categorie && form.sous_categorie

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) onUpload(file)
  }

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="col-span-2">
          <label className={LABEL_CLASS}>Nom</label>
          <input className={FIELD_CLASS} placeholder="Ex: Loyer, Voiture..." value={form.nom} onChange={e => set("nom", e.target.value)} />
        </div>

        <div>
          <label className={LABEL_CLASS}>Type</label>
          <div className="flex gap-2">
            {(["depense", "revenu"] as const).map(t => (
              <button key={t} onClick={() => set("type", t)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all border",
                  form.type === t ? (t === "revenu" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border-rose-500/40")
                    : "bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08]")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Montant (€)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} placeholder="0.00" value={form.montant} onChange={e => set("montant", e.target.value)} />
        </div>

        <div className="col-span-2">
          <CategorySubcategorySelect 
            variant="installment" 
            category={form.categorie} setCategory={v => set("categorie", v)} 
            subcategory={form.sous_categorie} setSubcategory={v => set("sous_categorie", v)} 
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Fréquence</label>
          <div className="relative">
            <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <select className={cn(FIELD_CLASS, "pl-9")} value={form.frequence} onChange={e => set("frequence", e.target.value)}>
              {FREQUENCIES.map(f => <option key={f} value={f} className="bg-[#0f0f13]">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Date de début</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input type="date" className={cn(FIELD_CLASS, "pl-9")} value={form.date_debut} onChange={e => set("date_debut", e.target.value)} />
          </div>
        </div>

        <div className="col-span-2">
          <label className={LABEL_CLASS}>Date de fin (optionnel)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input type="date" className={cn(FIELD_CLASS, "pl-9")} value={form.date_fin} onChange={e => set("date_fin", e.target.value)} />
          </div>
        </div>

        <div className="col-span-2">
          <label className={LABEL_CLASS}>Objectif lié (optionnel)</label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <select className={cn(FIELD_CLASS, "pl-9")} value={form.objectif_id || ""} onChange={e => set("objectif_id", e.target.value ? parseInt(e.target.value) : null)}>
              <option value="" className="bg-[#0f0f13]">Aucun objectif</option>
              {visibleObjectifs.map(goal => (
                <option key={goal.id} value={goal.id} className="bg-[#0f0f13]">{goal.nom} ({Math.round(goal.progression_pourcentage || 0)}%)</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-2">
          <label className={LABEL_CLASS}>Description (optionnel)</label>
          <input className={FIELD_CLASS} placeholder="Note libre..." value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-white/5">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Documents associés</label>
        <AttachmentSection attachments={attachments} onDelete={onDelete} isDeletingId={isDeletingId} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-xs font-medium text-indigo-400 hover:bg-white/[0.04] transition-all disabled:opacity-50">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          <span>{isUploading ? "Téléchargement..." : "Joindre un document (Facture, Contrat...)"}</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-all border border-transparent">Annuler</button>
        <button onClick={() => isValid && onSave(form)} disabled={!isValid}
          className={cn("flex-[2] py-3 rounded-xl text-sm font-bold transition-all shadow-lg",
            isValid ? "bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-[1.02]" : "bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed")}>
          Enregistrer l'échéance
        </button>
      </div>
    </div>
  )
}
