import { useState, useRef } from "react"
import { X, Save, Calendar, Repeat, Paperclip, Loader2, Tag, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentSection } from "../transactions/AttachmentSection"
import { CATEGORIES } from "../transactions/constants"
import type { Attachment } from "@/api"

interface InstallmentFormData {
  nom: string
  type: "Dépense" | "Revenu"
  categorie: string
  sous_categorie: string
  montant: string
  frequence: string
  date_debut: string
  date_fin: string
  description: string
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
    type: initial?.type ?? "Dépense",
    categorie: initial?.categorie ?? "Alimentation",
    sous_categorie: initial?.sous_categorie ?? "",
    montant: initial?.montant ?? "",
    frequence: initial?.frequence ?? "mensuelle",
    date_debut: initial?.date_debut ?? "",
    date_fin: initial?.date_fin ?? "",
    description: initial?.description ?? "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof InstallmentFormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const isValid = form.nom.trim() && form.montant && Number(form.montant) > 0 && form.categorie && form.sous_categorie

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) {
      onUpload(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {/* Nom */}
        <div className="col-span-2">
          <label className={LABEL_CLASS}>Nom</label>
          <input className={FIELD_CLASS} placeholder="Ex: Loyer, Voiture..." value={form.nom} onChange={e => set("nom", e.target.value)} />
        </div>

        {/* Type */}
        <div>
          <label className={LABEL_CLASS}>Type</label>
          <div className="flex gap-2">
            {(["Dépense", "Revenu"] as const).map(t => (
              <button key={t} onClick={() => set("type", t)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all border",
                  form.type === t ? (t === "Revenu" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border-rose-500/40")
                    : "bg-white/[0.04] text-white/40 border-white/[0.08] hover:bg-white/[0.08]")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Montant */}
        <div>
          <label className={LABEL_CLASS}>Montant (€)</label>
          <input type="number" min="0" step="0.01" className={FIELD_CLASS} placeholder="0.00" value={form.montant} onChange={e => set("montant", e.target.value)} />
        </div>

        {/* Catégorie & Sous-catégorie */}
        <div>
          <label className={LABEL_CLASS}>Catégorie</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <select className={cn(FIELD_CLASS, "pl-9")} value={form.categorie} 
              onChange={e => setForm(f => ({ ...f, categorie: e.target.value, sous_categorie: "" }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-slate-900">{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS}>Sous-catégorie *</label>
          <div className="relative">
            <List className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <select className={cn(FIELD_CLASS, "pl-9")} value={form.sous_categorie} onChange={e => set("sous_categorie", e.target.value)}>
              <option value="" className="bg-slate-900">(Aucune)</option>
              {CATEGORIES.find(c => c.value === form.categorie)?.subcategories.map(sub => (
                <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fréquence */}
        <div>
          <label className={LABEL_CLASS}>Fréquence</label>
          <div className="relative">
            <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <select className={cn(FIELD_CLASS, "pl-9")} value={form.frequence} onChange={e => set("frequence", e.target.value)}>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className={LABEL_CLASS}>Date de début</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input type="date" className={cn(FIELD_CLASS, "pl-9")} value={form.date_debut} onChange={e => set("date_debut", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS}>Date de fin (optionnel)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            <input type="date" className={cn(FIELD_CLASS, "pl-9")} value={form.date_fin} onChange={e => set("date_fin", e.target.value)} />
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className={LABEL_CLASS}>Description (optionnel)</label>
          <input className={FIELD_CLASS} placeholder="Note libre..." value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
      </div>

      {/* Attachments Section */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">Documents associés</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            Lier un fichier
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        
        <AttachmentSection 
          attachments={attachments} 
          onDelete={onDelete} 
          isDeletingId={isDeletingId}
        />

        {attachments.length === 0 && !isUploading && (
          <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
            <p className="text-[11px] text-white/20 italic text-center">Aucun document lié à cette échéance</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/70 border border-white/[0.08] hover:bg-white/[0.04] transition-all">
          <X className="w-4 h-4" />Annuler
        </button>
        <button onClick={() => isValid && onSave(form)} disabled={!isValid}
          className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            isValid ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30" : "bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed")}>
          <Save className="w-4 h-4" />Enregistrer
        </button>
      </div>
    </div>
  )
}
