"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, TrendingDown, TrendingUp, CreditCard, Search, Filter, CheckSquare, Square, Check, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFinancial } from "@/context/FinancialDataContext"
import { statusConfig, type Installment, type InstallmentStatus, type SortField, type SortDirection } from "@/components/echeances/echeance-types"
import { InstallmentRow } from "@/components/echeances/echeance-row"
import { FilterDropdown, SortDropdown } from "@/components/echeances/echeance-filters"
import { EcheanceCalendar } from "@/components/echeances/echeance-calendar"
import { EcheanceDetailModal } from "@/components/echeances/EcheanceDetailModal"
import { mapEcheanceToInstallment } from "@/components/echeances/echeance-utils"
import { InstallmentForm } from "@/components/echeances/InstallmentForm"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { api, type Attachment } from "@/api"
import { toast } from 'sonner'

const STATUS_OPTS = [{ value: "paid", label: "Payé" }, { value: "pending", label: "En attente" }, { value: "overdue", label: "À vérifier" }]

export default function EcheancesPage() {
  const { summary, transactions, loading, addEcheance, deleteEcheance } = useFinancial()
  const [search, setSearch] = useState("")
  const [statusF, setStatusF] = useState<string[]>([])
  const [catF, setCatF] = useState<string[]>([])
  const [typeF, setTypeF] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDirection>("asc")
  const [selected, setSelected] = useState<string[]>([])
  const [localItems, setLocalItems] = useState<Installment[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Installment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<Installment | null>(null)
  const [allEcheances, setAllEcheances] = useState<Installment[]>([])
  const [realCategories, setRealCategories] = useState<any[]>([])
  
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [calData, catData] = await Promise.all([
          api.getCalendarEcheances(),
          api.getCategories()
        ])
        setAllEcheances(calData.map(item => mapEcheanceToInstallment(item, catData)))
        setRealCategories(catData)
      } catch (e) {
        console.error("Failed to fetch initial data:", e)
      }
    }
    fetchInitialData()
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

  // Derive data: use allEcheances (projections) if available, fallback to summary
  const baseItems = useMemo<Installment[]>(() => {
    if (localItems) return localItems
    if (allEcheances.length > 0) return allEcheances
    const raw = summary?.prochaines_echeances
    if (raw && raw.length > 0) return raw.map((item: any) => mapEcheanceToInstallment(item, realCategories))
    return []
  }, [summary, localItems, allEcheances])

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
      const data = await api.getCalendarEcheances()
      setAllEcheances(data.map(item => mapEcheanceToInstallment(item, realCategories)))
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
      const data = await api.getCalendarEcheances()
      setAllEcheances(data.map(item => mapEcheanceToInstallment(item, realCategories)))
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
    const ord = { overdue: 0, pending: 1, paid: 2 } as Record<InstallmentStatus, number>
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    r = r.filter(i => {
      if (search) {
        const q = search.toLowerCase()
        if (!i.name.toLowerCase().includes(q) && !i.category.toLowerCase().includes(q)) return false
      }
      if (statusF.length && !statusF.includes(i.status)) return false
      if (catF.length && !catF.includes(i.category)) return false
      if (typeF.length && !typeF.includes(i.type)) return false
      return true
    })

    if (selectedDate) {
      r = r.filter(i => i.date_prevue && i.date_prevue.startsWith(selectedDate))
    } else if (!search && !statusF.length && !catF.length && !typeF.length) {
      // Default view: Overdue + Current Month
      r = r.filter(i => {
        const d = new Date(i.date_prevue)
        const isOverdue = i.status === "overdue"
        const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear
        return isOverdue || isThisMonth
      })
    }

    r.sort((a, b) => {
      const aDate = new Date(a.date_prevue)
      const bDate = new Date(b.date_prevue)
      
      // Secondary sorting logic
      const aThisMonth = aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear
      const bThisMonth = bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear
      
      if (!selectedDate) {
        if (aThisMonth && !bThisMonth) return -1
        if (!aThisMonth && bThisMonth) return 1
      }
      
      let cmp = 0
      if (sortField === "date") {
        cmp = aDate.getTime() - bDate.getTime()
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount
      } else if (sortField === "name") {
        cmp = a.name.localeCompare(b.name)
      } else {
        cmp = ord[a.status] - ord[b.status]
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return r
  }, [items, search, statusF, catF, typeF, sortField, sortDir, selectedDate])

  // Metric 1: dépenses réelles ce mois-ci (toutes transactions, pas juste les échéances)
  const now = new Date()
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const depenseCeMois = monthTransactions.filter(t => t.type === 'Dépense').reduce((s, t) => s + t.montant, 0)
  const revenCeMois = monthTransactions.filter(t => t.type === 'Revenu').reduce((s, t) => s + t.montant, 0)

  // Metric 2: argent restant fin de mois (revenus prévus ce mois - dépenses prévues ce mois parmi les échéances affichées)
  const echeancesCeMois = allEcheances.filter(i => {
    const d = new Date(i.date_prevue)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const echeanceRevenu = echeancesCeMois.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
  const echeanceDepense = echeancesCeMois.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const resteFinMois = revenCeMois - depenseCeMois + (echeanceRevenu - echeanceDepense)

  // Metric 3: solde cumulé depuis la première transaction
  const soldeCumule = transactions.reduce((s, t) => t.type === 'Revenu' ? s + t.montant : s - t.montant, 0)

  const hasFilters = !!(search || statusF.length || catF.length)
  const clearFilters = () => { setSearch(""); setStatusF([]); setCatF([]) }

  const CAT_OPTS = realCategories.map(c => ({ 
    value: typeof c === 'string' ? c : (c.name || c.nom), 
    label: typeof c === 'string' ? c : (c.name || c.nom) 
  }))

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
            {/* Card 1: Dépensé ce mois */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/15 flex-shrink-0">
                <TrendingDown className="w-6 h-6 text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/60">Dépensé ce mois</p>
                <p className="text-xl font-bold tabular-nums text-rose-400 truncate">
                  -{depenseCeMois.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{monthTransactions.filter(t => t.type === 'Dépense').length} transactions</p>
              </div>
            </div>

            {/* Card 2: Reste fin de mois */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", resteFinMois >= 0 ? "bg-emerald-500/15" : "bg-amber-500/15")}>
                <CreditCard className={cn("w-6 h-6", resteFinMois >= 0 ? "text-emerald-400" : "text-amber-400")} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", resteFinMois >= 0 ? "text-emerald-400/60" : "text-amber-400/60")}>Reste fin de mois</p>
                <p className={cn("text-xl font-bold tabular-nums truncate", resteFinMois >= 0 ? "text-emerald-400" : "text-amber-400")}>
                  {resteFinMois >= 0 ? '+' : ''}{resteFinMois.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">revenus - dépenses (réel + prévu)</p>
              </div>
            </div>

            {/* Card 3: Solde cumulé */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", soldeCumule >= 0 ? "bg-indigo-500/15" : "bg-rose-500/15")}>
                <TrendingUp className={cn("w-6 h-6", soldeCumule >= 0 ? "text-indigo-400" : "text-rose-400")} />
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", soldeCumule >= 0 ? "text-indigo-400/60" : "text-rose-400/60")}>Solde cumulé</p>
                <p className={cn("text-xl font-bold tabular-nums truncate", soldeCumule >= 0 ? "text-indigo-400" : "text-rose-400")}>
                  {soldeCumule >= 0 ? '+' : ''}{soldeCumule.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">depuis la 1ère transaction</p>
              </div>
            </div>
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
              <FilterDropdown label="Type" options={[{value: "expense", label: "Dépenses"}, {value: "income", label: "Revenus"}]} selected={typeF} onSelect={v => setTypeF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} onClear={() => setTypeF([])} />
              <FilterDropdown label="Statut" options={STATUS_OPTS} selected={statusF} onSelect={v => setStatusF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} onClear={() => setStatusF([])} />
              <FilterDropdown label="Catégorie" options={CAT_OPTS} selected={catF} onSelect={v => setCatF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} onClear={() => setCatF([])} />
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
                <InstallmentRow key={`${item.id}-${item.date_prevue}`} installment={item} onMarkPaid={markPaid} onEdit={handleEdit} onDelete={handleDeleteClick} onViewDetail={setSelectedDetail} isSelected={selected.includes(item.id)} onSelect={toggleSel} selectionMode={selMode} />
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
      
      {/* Detail Modal */}
      {selectedDetail && (
        <EcheanceDetailModal 
          installment={selectedDetail} 
          onClose={() => setSelectedDetail(null)}
          totalSpent={transactions
            .filter(t => String(t.echeance_id) === String(selectedDetail.echeance_base_id ?? selectedDetail.id))
            .reduce((sum, t) => sum + t.montant, 0)
          }
        />
      )}

      {/* Visibility Notice */}
      <div className="mt-12 mb-8 flex items-start justify-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] border-dashed">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-white/50 leading-relaxed">
            <span className="text-white/70 font-medium">Les échéances affichées sont celles du mois en cours.</span>
            {" "}Pour consulter les échéances d'un autre mois, cliquez sur le jour correspondant dans le calendrier à droite.
          </p>
          <p className="text-xs text-white/30 leading-relaxed italic">
            Note : Le calendrier couvre une fenêtre de <span className="text-white/50">6 mois en arrière</span> et <span className="text-white/50">24 mois en avant</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
