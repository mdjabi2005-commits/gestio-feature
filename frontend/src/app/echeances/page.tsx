"use client"
import { useState, useMemo, useEffect } from "react"
import { Plus, X, Info } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { type Installment, type InstallmentStatus, type SortField, type SortDirection } from "@/components/echeances/echeance-types"
import { InstallmentRow } from "@/components/echeances/echeance-row"
import { EcheanceCalendar } from "@/components/echeances/echeance-calendar"
import { EcheanceDetailModal } from "@/components/echeances/EcheanceDetailModal"
import { mapEcheanceToInstallment } from "@/components/echeances/echeance-utils"
import { InstallmentForm } from "@/components/echeances/InstallmentForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api, type Attachment } from "@/api"
import { toast } from 'sonner'
import { EcheanceMetrics } from "@/components/echeances/EcheanceMetrics"
import { EcheanceToolbar } from "@/components/echeances/EcheanceToolbar"
import { useInstallmentFilters } from "@/hooks/useInstallmentFilters"

const STATUS_OPTS = [{ value: "paid", label: "Payé" }, { value: "pending", label: "En attente" }, { value: "overdue", label: "À vérifier" }]

export default function EcheancesPage() {
  const { summary, transactions, loading, addEcheance, deleteEcheance } = useFinancial()
  const [search, setSearch] = useState(""), [statusF, setStatusF] = useState<string[]>([]), [catF, setCatF] = useState<string[]>([]), [typeF, setTypeF] = useState<string[]>([]), [sortField, setSortField] = useState<SortField>("date"), [sortDir, setSortDir] = useState<SortDirection>("asc"), [selected, setSelected] = useState<string[]>([]), [localItems, setLocalItems] = useState<Installment[] | null>(null), [showForm, setShowForm] = useState(false), [editTarget, setEditTarget] = useState<Installment | null>(null), [deleteId, setDeleteId] = useState<string | null>(null), [selectedDate, setSelectedDate] = useState<string | null>(null), [selectedDetail, setSelectedDetail] = useState<Installment | null>(null), [allEcheances, setAllEcheances] = useState<Installment[]>([]), [realCategories, setRealCategories] = useState<any[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([]), [isUploading, setIsUploading] = useState(false), [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  useEffect(() => { (async () => { const [calData, catData] = await Promise.all([api.getCalendarEcheances(), api.getCategories()]); setAllEcheances(calData.map(item => mapEcheanceToInstallment(item, catData))); setRealCategories(catData) })() }, [])
  useEffect(() => { if (editTarget?.id && showForm) (async () => { try { setAttachments(await api.getEcheanceAttachments(editTarget!.id)) } catch (e) {} })(); else setAttachments([]) }, [editTarget, showForm])

  const filtered = useInstallmentFilters(localItems ?? (summary?.prochaines_echeances?.map((i:any) => mapEcheanceToInstallment(i, realCategories)) || []), search, statusF, catF, typeF, sortField, sortDir, selectedDate)

  const handleSave = async (f: any) => {
    try {
        const p = { ...f, montant: parseFloat(f.montant), date_prevue: editTarget?.date_prevue || f.date_debut, date_debut: f.date_debut, date_fin: f.date_fin || null, description: f.description || "" }
        editTarget ? await api.updateEcheance(editTarget.id, p) : await addEcheance(p)
        setLocalItems(null); setAllEcheances((await api.getCalendarEcheances()).map(i => mapEcheanceToInstallment(i, realCategories))); toast.success("Succès")
    } catch { toast.error("Erreur") }
    setShowForm(false); setEditTarget(null)
  }

  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const handleSort = (f: SortField) => sortField === f ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortField(f), setSortDir("asc"))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white uppercase tracking-tighter">Prochaines Échéances</h1><p className="text-xs text-white/30 uppercase font-bold mt-1">Données via le moteur de récurrences actives</p></div>
        <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle</button>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <EcheanceMetrics transactions={transactions} allEcheances={allEcheances} summary={summary} />
          <EcheanceToolbar search={search} setSearch={setSearch} typeF={typeF} setTypeF={setTypeF} statusF={statusF} setStatusF={setStatusF} catF={catF} setCatF={setCatF} sortField={sortField} sortDirection={sortDir} onSort={handleSort} selMode={false} setSelMode={()=>{}} setSelected={setSelected} categoryOptions={realCategories.map(c => ({ value: c.name || c.nom, label: c.name || c.nom }))} statusOptions={STATUS_OPTS} filteredCount={filtered.length} />

          <div className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/[0.03]">
              {filtered.length > 0 ? filtered.map(item => (
                <InstallmentRow key={`${item.id}-${item.date_prevue}`} installment={item} onMarkPaid={(id) => setLocalItems((localItems || []).map(i => i.id === id ? { ...i, status: "paid" as InstallmentStatus } : i))} onEdit={(item) => { setEditTarget(item); setShowForm(true) }} onDelete={setDeleteId} onViewDetail={setSelectedDetail} isSelected={selected.includes(item.id)} onSelect={toggleSel} selectionMode={false} />
              )) : <div className="py-20 text-center text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Aucune échéance trouvée</div>}
            </div>
          </div>
        </div>

        <aside className="w-80 space-y-6">
          <EcheanceCalendar items={allEcheances} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10"><h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Légende</h3><div className="space-y-3">{[["Total", allEcheances.length], ["Payés", allEcheances.filter(i => i.status === "paid").length], ["En retard", allEcheances.filter(i => i.status === "overdue").length]].map(([l, v]) => (<div key={l as string} className="flex justify-between items-center"><span className="text-[10px] font-bold text-white/40 uppercase">{l}</span><span className="text-xs font-black text-white">{v}</span></div>))}</div></div>
        </aside>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditTarget(null) }}>
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h2 className="text-xs font-black text-white uppercase tracking-widest">{editTarget ? "Modifier" : "Nouvelle"} Échéance</h2><button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white/40" /></button></div>
            <InstallmentForm initial={editTarget ? { nom: editTarget.name, type: editTarget.type === "income" ? "Revenu" : "Dépense", categorie: editTarget.category, sous_categorie: editTarget.sous_categorie || "", montant: String(editTarget.amount), frequence: editTarget.frequence, date_debut: editTarget.date_debut, date_fin: editTarget.date_fin, description: editTarget.description } : undefined} onSave={handleSave} onCancel={() => setShowForm(false)} attachments={attachments} onUpload={async f => { try { await api.uploadEcheanceAttachment(editTarget!.id, f); setAttachments(await api.getEcheanceAttachments(editTarget!.id)) } catch {} }} onDelete={async id => { if (confirm("Supprimer ?")) { try { await api.deleteAttachment(id); setAttachments(p => p.filter(a => a.id !== id)) } catch {} } }} isUploading={isUploading} isDeletingId={deletingDocId} />
          </div>
        </div>
      )}

      <ConfirmDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)} title="Supprimer ?" description="Irréversible." confirmText="Supprimer" onConfirm={async () => { if (deleteId) { try { await deleteEcheance(deleteId); setLocalItems((localItems || []).filter(i => i.id !== deleteId)); setAllEcheances((await api.getCalendarEcheances()).map(i => mapEcheanceToInstallment(i, realCategories))); toast.success("Supprimé") } catch {} } setDeleteId(null) }} variant="destructive" />
      {selectedDetail && <EcheanceDetailModal installment={selectedDetail} onClose={() => setSelectedDetail(null)} totalSpent={transactions.filter(t => String(t.echeance_id) === String(selectedDetail.echeance_base_id ?? selectedDetail.id)).reduce((sum, t) => sum + t.montant, 0)} />}
    </div>
  )
}
