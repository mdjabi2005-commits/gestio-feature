"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, TrendingDown, TrendingUp, CreditCard, Search, Filter, CheckSquare, Square, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFinancial } from "@/context/FinancialDataContext"
import { categoryColors, statusConfig, type Installment, type InstallmentStatus, type SortField, type SortDirection } from "@/components/echeances/echeance-types"
import { InstallmentRow } from "@/components/echeances/echeance-row"
import { FilterDropdown, SortDropdown } from "@/components/echeances/echeance-filters"
import { EcheanceCalendar } from "@/components/echeances/echeance-calendar"
import { mapEcheanceToInstallment } from "@/components/echeances/echeance-utils"
import { InstallmentForm } from "@/components/echeances/InstallmentForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api, type Attachment } from "@/api"
import { toast } from 'sonner'

const STATUS_OPTS = [{ value: "paid", label: "Payé" }, { value: "pending", label: "En attente" }, { value: "overdue", label: "À vérifier" }]
const CATEGORY_OPTS = Object.entries(categoryColors).map(([k, v]) => ({ value: k, label: v.label }))

export default function EcheancesPage() {
  const { summary, transactions, loading, addEcheance, deleteEcheance } = useFinancial()
  const [search, setSearch] = useState("")
  const [statusF, setStatusF] = useState<string[]>([])
  const [catF, setCatF] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDirection>("asc")
  const [selected, setSelected] = useState<string[]>([])
  const [localItems, setLocalItems] = useState<Installment[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Installment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [allEcheances, setAllEcheances] = useState<Installment[]>([])
  
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  useEffect(() => {
    const fetchAllEcheances = async () => {
      try {
        const data = await api.getEcheances()
        setAllEcheances(data.map(mapEcheanceToInstallment))
      } catch (e) {
        console.error("Failed to fetch all echeances:", e)
      }
    }
    fetchAllEcheances()
  }, [])

  useEffect(() => {
    if (editTarget?.id && showForm) {
      loadAttachments(editTarget.id)
    } else {
      setAttachments([])
    }
  }, [editTarget, showForm])

  const loadAttachments = async (id: string) => {
    try {
      const docs = await api.getEcheanceAttachments(id)
      setAttachments(docs)
    } catch (err) {
      console.error("Failed to load attachments", err)
    }
  }

  const handleUpload = async (file: File) => {
    if (!editTarget) return
    setIsUploading(true)
    try {
      await api.uploadEcheanceAttachment(editTarget.id, file)
      await loadAttachments(editTarget.id)
    } catch (err) {
      alert("Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAttachment = async (id: number) => {
    if (!confirm("Supprimer ce document ?")) return
    setDeletingDocId(id)
    try {
      await api.deleteAttachment(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert("Erreur lors de la suppression")
    } finally {
      setDeletingDocId(null)
    }
  }

  // Derive data: strictly use backend echeances
  const baseItems = useMemo<Installment[]>(() => {
    if (localItems) return localItems
    const raw = summary?.prochaines_echeances
    if (raw && raw.length > 0) return raw.map(mapEcheanceToInstallment)
    return []
  }, [summary, localItems])

  const markPaid = (id: string) => {
    const source = localItems ?? baseItems
    setLocalItems(source.map(i => i.id === id ? { ...i, status: "paid" as InstallmentStatus } : i))
  }

  const markSelPaid = () => {
    const source = localItems ?? baseItems
    setLocalItems(source.map(i => selected.includes(i.id) ? { ...i, status: "paid" as InstallmentStatus } : i))
    setSelected([])
  }

  const handleEdit = (item: Installment) => { setEditTarget(item); setShowForm(true) }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEcheance(id);
      const source = localItems ?? baseItems
      setLocalItems(source.filter(i => i.id !== id))
      const data = await api.getEcheances()
      setAllEcheances(data.map(mapEcheanceToInstallment))
      toast.success("Échéance supprimée !");
    } catch {
      const source = localItems ?? baseItems
      setLocalItems(source.filter(i => i.id !== id))
      toast.error("Échec de la suppression");
    }
  }

  const handleSave = async (formData: any) => {
    const payload = {
      ...formData,
      montant: parseFloat(formData.montant),
      date_prevue: editTarget?.date_prevue || formData.date_debut || new Date().toISOString().slice(0, 10),
      date_debut: formData.date_debut || new Date().toISOString().slice(0, 10),
      date_fin: formData.date_fin || null,
      description: formData.description || "",
    }
    try {
      if (editTarget) {
        await api.updateEcheance(editTarget.id, payload)
        toast.success("Échéance mise à jour !");
      } else {
        await addEcheance(payload)
        toast.success("Échéance créée !");
      }
      setLocalItems(null)
      const data = await api.getEcheances()
      setAllEcheances(data.map(mapEcheanceToInstallment))
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement : " + (err.message || "Erreur inconnue"))
    }
    setShowForm(false); setEditTarget(null)
  }

  const [selMode, setSelMode] = useState(false)
  const toggleSel = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const handleSort = (f: SortField) => { if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortField(f); setSortDir("asc") } }

  const items = localItems ?? baseItems

  const filtered = useMemo(() => {
    let r = [...items]
    if (selectedDate) {
      r = r.filter(i => i.date_prevue && i.date_prevue.startsWith(selectedDate))
    }
    if (search) { const q = search.toLowerCase(); r = r.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) }
    if (statusF.length) r = r.filter(i => statusF.includes(i.status))
    if (catF.length) r = r.filter(i => catF.includes(i.categoryType))
    const ord = { overdue: 0, pending: 1, paid: 2 } as Record<InstallmentStatus, number>
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    r.sort((a, b) => {
      const aDate = new Date(a.date_prevue)
      const bDate = new Date(b.date_prevue)
      const aThisMonth = aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear
      const bThisMonth = bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear
      if (aThisMonth && !bThisMonth) return -1
      if (!aThisMonth && bThisMonth) return 1
      const cmp = sortField === "date" ? a.daysRemaining - b.daysRemaining : sortField === "amount" ? a.amount - b.amount : sortField === "name" ? a.name.localeCompare(b.name) : ord[a.status] - ord[b.status]
      return sortDir === "asc" ? cmp : -cmp
    })
    return r
  }, [items, search, statusF, catF, sortField, sortDir, selectedDate])

  const expenses = items.filter(i => i.type === "expense"), incomes = items.filter(i => i.type === "income")
  const totalExp = expenses.reduce((s, i) => s + i.amount, 0), totalInc = incomes.reduce((s, i) => s + i.amount, 0)
  const balance = totalInc - totalExp
  const hasFilters = !!(search || statusF.length || catF.length)
  const clearFilters = () => { setSearch(""); setStatusF([]); setCatF([]) }

  const deadlineDates = items.map(i => new Date(i.date).getDate()).filter(Boolean)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prochaines Échéances</h1>
          <p className="text-sm text-white/40 mt-0.5">{summary?.prochaines_echeances?.length > 0 ? "Données depuis les récurrences actives" : "Aucune échéance prévue pour le moment"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/50">{items.length} éléments</span>
          </div>
          <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all">
            <Plus className="w-4 h-4" />Nouvelle
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Dépenses", value: `-${totalExp.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, count: expenses.length, icon: TrendingDown, iconBg: "bg-rose-500/15", iconColor: "text-rose-400", textColor: "text-rose-400", textLabel: "text-rose-400/60" },
              { label: "Revenus",  value: `+${totalInc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, count: incomes.length,  icon: TrendingUp,   iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", textColor: "text-emerald-400", textLabel: "text-emerald-400/60" },
              { label: "Solde",    value: `${balance >= 0 ? "+" : ""}${balance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, count: null, icon: CreditCard, iconBg: balance >= 0 ? "bg-emerald-500/15" : "bg-rose-500/15", iconColor: balance >= 0 ? "text-emerald-400" : "text-rose-400", textColor: balance >= 0 ? "text-emerald-400" : "text-rose-400", textLabel: "text-white/40" },
            ].map(({ label, value, count, icon: Icon, iconBg, iconColor, textColor, textLabel }) => (
              <div key={label} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}><Icon className={cn("w-6 h-6", iconColor)} /></div>
                <div>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider", textLabel)}>{label}</p>
                  <p className={cn("text-xl font-bold tabular-nums", textColor)}>{value}</p>
                  {count !== null && <p className="text-[10px] text-white/30 mt-0.5">{count} transactions</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-all" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-white/40" /></button>}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/30" />
              <FilterDropdown label="Statut" options={STATUS_OPTS} selected={statusF} onSelect={v => setStatusF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} onClear={() => setStatusF([])} />
              <FilterDropdown label="Catégorie" options={CATEGORY_OPTS} selected={catF} onSelect={v => setCatF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} onClear={() => setCatF([])} />
            </div>
            <SortDropdown sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
            <button onClick={() => { setSelMode(!selMode); setSelected([]) }} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all", selMode ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.06]")}>
              <CheckSquare className="w-3.5 h-3.5" />Sélection
            </button>
            {hasFilters && <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all"><X className="w-3.5 h-3.5" />Effacer</button>}
          </div>

          {selMode && (
            <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-3">
                <button onClick={() => { const ids = filtered.filter(i => i.status !== "paid").map(i => i.id); setSelected(p => p.length === ids.length ? [] : ids) }} className="flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200">
                  {selected.length === filtered.filter(i => i.status !== "paid").length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}Tout
                </button>
                <span className="text-xs text-white/40">{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>
              </div>
              {selected.length > 0 && (
                <button onClick={markSelPaid} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                  <Check className="w-4 h-4" />Marquer payé ({selected.length})
                </button>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.05]">
              <h2 className="text-sm font-semibold text-white">
                Liste des échéances
                {hasFilters && <span className="ml-2 text-xs font-normal text-white/40">({filtered.length} résultat{filtered.length > 1 ? "s" : ""})</span>}
              </h2>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {filtered.length > 0 ? filtered.map(item => (
                <InstallmentRow key={item.id} installment={item} onMarkPaid={markPaid} onEdit={handleEdit} onDelete={handleDeleteClick} isSelected={selected.includes(item.id)} onSelect={toggleSel} selectionMode={selMode} />
              )) : (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-white/40">Aucune échéance trouvée</p>
                  {hasFilters && <button onClick={clearFilters} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Effacer les filtres</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — largie à w-80 */}
        <aside className="w-80 flex-shrink-0 space-y-4">
          <EcheanceCalendar items={allEcheances} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white mb-3">Récapitulatif</h3>
            <div className="space-y-2">
              {[
                ["Total éléments", `${items.length}`],
                ["Payés", `${items.filter(i => i.status === "paid").length}`],
                ["En attente", `${items.filter(i => i.status === "pending").length}`],
                ["À vérifier", `${items.filter(i => i.status === "overdue").length}`],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{label}</span>
                  <span className="text-xs font-semibold text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Edit/Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowForm(false); setEditTarget(null) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg mx-4 p-6 rounded-2xl bg-[#0f1117] border border-white/[0.08] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">{editTarget ? "Modifier l'échéance" : "Nouvelle échéance"}</h2>
              <button onClick={() => { setShowForm(false); setEditTarget(null) }} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <InstallmentForm
              initial={editTarget ? { 
                nom: editTarget.name, 
                type: editTarget.type === "income" ? "Revenu" : "Dépense", 
                categorie: editTarget.category, 
                sous_categorie: editTarget.sous_categorie || "",
                montant: String(editTarget.amount),
                frequence: editTarget.frequence,
                date_debut: editTarget.date_debut,
                date_fin: editTarget.date_fin,
                description: editTarget.description
              } : undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditTarget(null) }}
              attachments={attachments}
              onUpload={handleUpload}
              onDelete={handleDeleteAttachment}
              isUploading={isUploading}
              isDeletingId={deletingDocId}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer cette échéance ?"
        description="Cette action est irréversible. L'échéance et toutes ses occurrences seront supprimées."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
        }}
      />
    </div>
  )
}
