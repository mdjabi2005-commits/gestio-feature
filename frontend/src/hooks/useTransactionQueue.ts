"use client"
import { useState } from 'react'
import { api, type ScannedTicket } from '@/api'
import { toast } from 'sonner'

export function useTransactionQueue(refreshData: () => void, setEditingTransaction: (t: any) => void, setIsAddModalOpen: (b: boolean) => void, setIsViewMode: (b: boolean) => void) {
  const [scanResultsQueue, setScanResultsQueue] = useState<ScannedTicket[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleTransactionSuccess = () => {
    if (editingIndex !== null) {
      setScanResultsQueue(prev => prev.filter((_, i) => i !== editingIndex))
      setEditingIndex(null)
    }
    setEditingTransaction(null)
    setIsAddModalOpen(false)
    setIsViewMode(false)
    refreshData()
  }

  const handleScanResults = (results: ScannedTicket[]) => {
    const processed: ScannedTicket[] = results.map(ticket => {
      // Attach archived_path to the transaction if available
      if (ticket.result.archived_path) {
        ticket.result.transaction.attachment = ticket.result.archived_path
      }
      return ticket
    })
    setScanResultsQueue(prev => [...prev, ...processed])
  }

  const handleValidate = async (index: number) => {
    const { result, file } = scanResultsQueue[index]
    try {
      const transactionId = await api.addTransaction(result.transaction)
      // Only upload if NOT already archived (e.g. normal ticket scan)
      if (transactionId && file && !result.transaction.attachment) {
        try { await api.uploadAttachment(transactionId, file) }
        catch (e) { toast.error("Échec de la pièce jointe") }
      }
      setScanResultsQueue(prev => prev.filter((_, i) => i !== index))
      refreshData()
      toast.success(file ? "Validé avec succès ! ⚡" : "Transaction créée !")
    } catch (e) { toast.error("Échec de la validation") }
  }

  const currentScanResult = editingIndex !== null ? scanResultsQueue[editingIndex].result : null
  const currentScanFile = editingIndex !== null ? scanResultsQueue[editingIndex].file : null

  return {
    scanResultsQueue, setScanResultsQueue, editingIndex, setEditingIndex,
    currentScanResult, currentScanFile,
    handleScanResults, handleValidate, handleTransactionSuccess
  }
}
