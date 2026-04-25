import React, { useState, useRef } from "react"
import { X, Save, Calendar, Repeat, Paperclip, Loader2, Target, Sparkles, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentSection } from "../transactions/AttachmentSection"
import { CategorySubcategorySelect } from "@/components/ui/CategorySubcategorySelect"
import { useFinancial } from "@/context/FinancialDataContext"

const FREQUENCIES = ["mensuelle", "hebdomadaire", "annuelle", "trimestrielle"]
const FIELD_CLASS = "w-full px-3 py-2 rounded-lg bg-white/[0.08] border border-white/[0.12] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/60 transition-all appearance-none"
const LABEL_CLASS = "block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5"

export function InstallmentForm({ initial, onSave, onCancel, attachments = [], onUpload, onDelete, isUploading = false, isDeletingId = null }: any) {
  const [step, setStep] = useState(1);
  const [magic, setMagic] = useState("");
  const [form, setForm] = useState<any>({
    nom: initial?.nom ?? "", type: initial?.type ?? "depense", categorie: initial?.categorie ?? "Alimentation",
    sous_categorie: initial?.sous_categorie ?? "", montant: initial?.montant ?? "", frequence: initial?.frequence ?? "mensuelle",
    date_debut: initial?.date_debut ?? "", date_fin: initial?.date_fin ?? "", description: initial?.description ?? "",
    statut: initial?.statut ?? "active", objectif_id: initial?.objectif_id ?? null,
  })

  const { objectifs } = useFinancial();
  const fileInputRef = useRef<any>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleMagic = (val: string) => {
    setMagic(val);
    const parts = val.toLowerCase().split(" ");
    if (parts.length > 0) set("nom", parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
    const amount = parts.find(p => !isNaN(parseFloat(p)));
    if (amount) set("montant", amount);
    const freq = FREQUENCIES.find(f => parts.some(p => f.includes(p)));
    if (freq) set("frequence", freq);
  }

  const steps = [
    { title: "Identité", fields: ["nom", "type"] },
    { title: "Finance", fields: ["montant", "frequence", "date_debut"] },
    { title: "Classement", fields: ["categorie"] },
    { title: "Documents", fields: [] }
  ];

  const canNext = step === 1 ? form.nom.trim() : step === 2 ? (form.montant && form.date_debut) : step === 3 ? form.categorie.trim() : true;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2 mb-2">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i + 1 <= step ? "bg-indigo-500" : "bg-white/10")} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="relative group">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            <input className={cn(FIELD_CLASS, "pl-10 h-12 bg-indigo-500/5 border-indigo-500/20")} placeholder="Magic: 'Netflix 13.99 mensuel'..." value={magic} onChange={e => handleMagic(e.target.value)} />
          </div>
          <div><label className={LABEL_CLASS}>Nom de l'échéance</label><input className={FIELD_CLASS} value={form.nom} onChange={e => set("nom", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLASS}>Type</label>
              <div className="flex gap-2">{(["depense", "revenu"] as const).map(t => (
                <button key={t} type="button" onClick={() => set("type", t)} className={cn("flex-1 py-2 rounded-lg text-xs font-bold border transition-all", form.type === t ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40" : "bg-white/5 text-white/30 border-white/10")}>{t}</button>
              ))}</div>
            </div>
            <div><label className={LABEL_CLASS}>Statut</label>
              <div className="flex gap-2">{(["active", "inactive"] as const).map(s => (
                <button key={s} type="button" onClick={() => set("statut", s)} className={cn("flex-1 py-2 rounded-lg text-[10px] uppercase font-black border transition-all", form.statut === s ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-white/5 text-white/30 border-white/10")}>{s === "active" ? "Actif" : "Pause"}</button>
              ))}</div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLASS}>Montant (€)</label><input type="number" className={FIELD_CLASS} value={form.montant} onChange={e => set("montant", e.target.value)} /></div>
            <div><label className={LABEL_CLASS}>Fréquence</label><select className={FIELD_CLASS} value={form.frequence} onChange={e => set("frequence", e.target.value)}>{FREQUENCIES.map(f => <option key={f} value={f} className="bg-[#0f0f13]">{f}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL_CLASS}>Date début</label><input type="date" className={FIELD_CLASS} value={form.date_debut} onChange={e => set("date_debut", e.target.value)} /></div>
            <div><label className={LABEL_CLASS}>Date fin (Optionnel)</label><input type="date" className={FIELD_CLASS} value={form.date_fin} onChange={e => set("date_fin", e.target.value)} /></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <CategorySubcategorySelect variant="installment" category={form.categorie} setCategory={(v:any) => set("categorie", v)} subcategory={form.sous_categorie} setSubcategory={(v:any) => set("sous_categorie", v)} />
          <div><label className={LABEL_CLASS}>Objectif lié</label>
            <select className={FIELD_CLASS} value={form.objectif_id || ""} onChange={e => set("objectif_id", e.target.value ? parseInt(e.target.value) : null)}>
              <option value="">Aucun objectif</option>
              {objectifs.map((o:any) => <option key={o.id} value={o.id}>{o.nom}</option>)}
            </select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div><label className={LABEL_CLASS}>Note libre</label><input className={FIELD_CLASS} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          <AttachmentSection attachments={attachments} onDelete={onDelete} isDeletingId={isDeletingId} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs font-bold text-indigo-400 hover:bg-white/5 transition-all">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Paperclip className="w-4 h-4 inline mr-2" />Joindre un document</>}
          </button>
          <input type="file" ref={fileInputRef} onChange={e => onUpload?.(e.target.files?.[0])} className="hidden" />
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-white/5">
        {step > 1 ? <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Précédent</button> : <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-xs font-bold text-white/40 hover:text-white/60">Annuler</button>}
        {step < 4 ? <button disabled={!canNext} onClick={() => setStep(step + 1)} className="flex-[2] py-3 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2">Suivant <ChevronRight className="w-4 h-4" /></button>
                 : <button disabled={!canNext} onClick={() => onSave(form)} className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button>}
      </div>
    </div>
  )
}
