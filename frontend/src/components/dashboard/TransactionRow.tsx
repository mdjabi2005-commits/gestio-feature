"use client"
import React from 'react'
import { TransactionRowView } from './TransactionRowView'
import { TransactionRowEdit } from './TransactionRowEdit'

interface TransactionRowProps {
  transaction: {
    id?: number
    type: "depense" | "revenu"
    description?: string
    montant: number
    categorie: string
    sous_categorie?: string
    date: string
    status?: "completed" | "pending" | "failed"
    merchant?: string
    has_attachments?: boolean
    attachment?: string
    objectif_id?: number
  }
  index: number
  isLast: boolean
  categories: any[]
  categoriesYaml?: any[]
  objectifs?: any[]
  isSelected?: boolean
  onSelect?: (id: number, selected: boolean) => void
  isEditing?: boolean
  onUpdate?: (id: number, data: Partial<TransactionRowProps['transaction']>) => void
  onEdit?: (t: TransactionRowProps['transaction']) => void
  onView?: (t: TransactionRowProps['transaction']) => void
  onDelete?: (id: number) => void
  onAttach?: (id: number) => void
}

export function TransactionRow({
  transaction,
  index,
  isLast,
  categories,
  categoriesYaml = [],
  objectifs = [],
  isSelected = false,
  onSelect,
  isEditing = false,
  onUpdate,
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionRowProps) {
  if (isEditing) {
    return (
      <TransactionRowEdit
        transaction={transaction}
        categoriesYaml={categoriesYaml}
        objectifs={objectifs}
        isSelected={isSelected || false}
        onSelect={onSelect || (() => {})}
        onUpdate={onUpdate || (() => {})}
      />
    )
  }

  return (
    <TransactionRowView
      transaction={transaction}
      categories={categories}
      isSelected={isSelected || false}
      isLast={isLast}
      onSelect={onSelect || (() => {})}
      onView={onView || (() => {})}
      onEdit={onEdit || (() => {})}
      onDelete={onDelete || (() => {})}
      onAttach={onAttach || (() => {})}
    />
  )
}
