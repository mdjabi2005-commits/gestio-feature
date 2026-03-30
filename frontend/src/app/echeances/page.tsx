"use client"
import { useState, useMemo, useEffect } from "react"
import { Info } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { type Installment, type InstallmentStatus, type SortField, type SortDirection } from "@/components/echeances/echeance-types"
import { InstallmentRow } from "@/components/echeances/echeance-row"
import { EcheanceCalendar } from "@/components/echeances/echeance-calendar"
import { EcheanceDetailModal } from "@/components/echeances/EcheanceDetailModal"
import { mapEcheanceToInstallment } from "@/components/echeances/echeance-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api } from "@/api"
import { toast } from 'sonner'
import { EcheanceMetrics } from "@/components/echeances/EcheanceMetrics"
import { EcheanceToolbar } from "@/components/echeances/EcheanceToolbar"
import { useInstallmentFilters } from "@/hooks/useInstallmentFilters"

const STATUS_OPTS = [{ value: "paid", label: "Payé" }, { value: "pending", label: "En attente" }, { value: "overdue", label: "À vérifier" }]

export default function EcheancesPage() {
  const { 
    summary, transactions, loading, deleteEcheance,
    setIsEcheanceModalOpen, setEditingEcheance 
  } = useFinancial()
  
  const [search, setSearch] = useState(""), [statusF, setStatusF] = useState<string[]>([]), [catF, setCatF] = useState<string[]>([]), [typeF, setTypeF] = useState<string[]>([]), [sortField, setSortField] = useState<SortField>("date"), [sortDir, setSortDir] = useState<SortDirection>("asc"), [selected, setSelected] = useState<string[]>([]), [localItems, setLocalItems] = useState<Installment[] | null>(null), [deleteId, setDeleteId] = useState<string | null>(null), [selectedDate, setSelectedDate] = useState<string | null>(null), [selectedDetail, setSelectedDetail] = useState<Installment | null>(null), [allEcheances, setAllEcheances] = useState<Installment[]>([]), [realCategories, setRealCategories] = useState<any[]>([])

  useEffect(() => { (async () => { const [calData, catData] = await Promise.all([api.getCalendarEcheances(), api.getCategories()]); setAllEcheances(calData.map(item => mapEcheanceToInstallment(item, catData))); setRealCategories(catData) })() }, [])

  const filtered = useInstallmentFilters(localItems ?? (summary?.prochaines_echeances?.map((i:any) => mapEcheanceToInstallment(i, realCategories)) || []), search, statusF, catF, typeF, sortField, sortDir, selectedDate)

  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const handleSort = (f: SortField) => sortField === f ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortField(f), setSortDir("asc"))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white uppercase tracking-tighter">Prochaines Échéances</h1><p className="text-xs text-white/30 uppercase font-bold mt-1">Données via le moteur de récurrences actives</p></div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <EcheanceMetrics transactions={transactions} allEcheances={allEcheances} summary={summary} />
          <EcheanceToolbar search={search} setSearch={setSearch} typeF={typeF} setTypeF={setTypeF} statusF={statusF} setStatusF={setStatusF} catF={catF} setCatF={setCatF} sortField={sortField} sortDirection={sortDir} onSort={handleSort} selMode={false} setSelMode={()=>{}} setSelected={setSelected} categoryOptions={realCategories.map(c => ({ value: c.name || c.nom, label: c.name || c.nom }))} statusOptions={STATUS_OPTS} filteredCount={filtered.length} />

          <div className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/[0.03]">
              {filtered.length > 0 ? filtered.map(item => (
                <InstallmentRow 
                  key={`${item.id}-${item.date_prevue}`} 
                  installment={item} 
                  onMarkPaid={(id) => setLocalItems((localItems || []).map(i => i.id === id ? { ...i, statut: "paid" as InstallmentStatus } : i))} 
                  onEdit={(item) => { 
                    setEditingEcheance({
                      ...item,
                      montant: String(item.montant),
                      statut_base: (item as any).statut_base || "active"
                    }); 
                    setIsEcheanceModalOpen(true);
                  }} 
                  onDelete={setDeleteId} 
                  onViewDetail={setSelectedDetail} 
                  isSelected={selected.includes(item.id)} 
                  onSelect={toggleSel} 
                  selectionMode={false} 
                />
              )) : <div className="py-20 text-center text-[10px] font-black uppercase text-white/20 tracking-[0.2em]">Aucune échéance trouvée</div>}
            </div>
          </div>
        </div>

        <aside className="w-80 space-y-6">
          <EcheanceCalendar items={allEcheances} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10"><h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Légende</h3><div className="space-y-3">{[["Total", allEcheances.length], ["Payés", allEcheances.filter(i => i.statut === "paid").length], ["En retard", allEcheances.filter(i => i.statut === "overdue").length]].map(([l, v]) => (<div key={l as string} className="flex justify-between items-center"><span className="text-[10px] font-bold text-white/40 uppercase">{l}</span><span className="text-xs font-black text-white">{v}</span></div>))}</div></div>
        </aside>
      </div>

      <ConfirmDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)} title="Supprimer ?" description="Irréversible." confirmText="Supprimer" onConfirm={async () => { if (deleteId) { try { await deleteEcheance(deleteId); setLocalItems(null); setAllEcheances((await api.getCalendarEcheances()).map(i => mapEcheanceToInstallment(i, realCategories))); toast.success("Supprimé") } catch {} } setDeleteId(null) }} variant="destructive" />
      {selectedDetail && <EcheanceDetailModal installment={selectedDetail} onClose={() => setSelectedDetail(null)} totalSpent={transactions.filter(t => String(t.echeance_id) === String(selectedDetail.echeance_base_id ?? selectedDetail.id)).reduce((sum, t) => sum + t.montant, 0)} />}
    </div>
  )
}
