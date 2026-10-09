'use client'

import { useState } from 'react'
import { ChecklistItem } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X, CalendarDays, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistProps {
  activityId: string
  items: ChecklistItem[]
  canEdit?: boolean
  onUpdate?: () => void
}

function parseChecklistInput(raw: string): { text: string; due_date: string } {
  const parts = raw.split(';')
  if (parts.length < 2) return { text: raw.trim(), due_date: '' }
  const text = parts[0].trim()
  const datePart = parts.slice(1).join(';').trim()
  const match = datePart.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
  if (!match) return { text: raw.trim(), due_date: '' }
  const day = match[1].padStart(2, '0')
  const month = match[2].padStart(2, '0')
  const year = match[3] ?? new Date().getFullYear().toString()
  return { text, due_date: `${year}-${month}-${day}` }
}

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function isOverdueDate(iso: string) {
  const today = new Date().toISOString().split('T')[0]
  return iso < today
}

export function Checklist({ activityId, items: initialItems, canEdit = false, onUpdate }: ChecklistProps) {
  const supabase = createClient()
  const [items, setItems] = useState<ChecklistItem[]>(
    [...initialItems].sort((a, b) => a.order_index - b.order_index)
  )
  const [newItemText, setNewItemText] = useState('')
  const [newItemDate, setNewItemDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [showDateFor, setShowDateFor] = useState<string | null>(null)

  const completedCount = items.filter((i) => i.completed).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  async function saveEdit(itemId: string) {
    if (!editingText.trim()) { setEditingId(null); return }
    const due_date = editingDate || null
    await (supabase as any).from('checklist_items').update({ text: editingText.trim(), due_date }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, text: editingText.trim(), due_date } : i))
    setEditingId(null)
    onUpdate?.()
  }

  async function toggleItem(item: ChecklistItem) {
    const newCompleted = !item.completed
    await supabase.from('checklist_items').update({ completed: newCompleted }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: newCompleted } : i))
    onUpdate?.()
  }

  async function addItem() {
    if (!newItemText.trim()) return
    setAdding(true)
    const parsed = parseChecklistInput(newItemText)
    const finalText = parsed.text
    const finalDate = parsed.due_date || newItemDate || null
    const { data } = await (supabase as any)
      .from('checklist_items')
      .insert({
        activity_id: activityId,
        text: finalText,
        order_index: items.length,
        completed: false,
        due_date: finalDate,
      })
      .select()
      .single()
    if (data) {
      setItems(prev => [...prev, data as ChecklistItem])
      setNewItemText('')
      setNewItemDate('')
      setShowDateFor(null)
    }
    setAdding(false)
    onUpdate?.()
  }

  async function deleteItem(itemId: string) {
    await supabase.from('checklist_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
    onUpdate?.()
  }

  async function clearDate(itemId: string) {
    await (supabase as any).from('checklist_items').update({ due_date: null }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, due_date: null } : i))
    onUpdate?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-700">
          Checklist ({completedCount}/{items.length})
        </h4>
      </div>

      {items.length > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const overdue = item.due_date && !item.completed && isOverdueDate(item.due_date)
          return (
            <div key={item.id} className={cn('rounded-lg border px-3 py-2 group transition-colors', overdue ? 'bg-red-50 border-red-100' : 'bg-gray-50/50 border-transparent hover:border-gray-100')}>
              {editingId === item.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={item.completed} disabled />
                    <Input
                      autoFocus
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                      className="h-7 text-sm flex-1"
                    />
                    <button onClick={() => saveEdit(item.id)} className="text-green-600 hover:text-green-700 shrink-0"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <Input
                      type="date"
                      value={editingDate}
                      onChange={e => setEditingDate(e.target.value)}
                      className="h-7 text-xs w-36"
                    />
                    {editingDate && (
                      <button onClick={() => setEditingDate('')} className="text-gray-400 hover:text-gray-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => canEdit ? toggleItem(item) : undefined}
                    disabled={!canEdit}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-sm', item.completed ? 'line-through text-gray-400' : 'text-gray-700')}>
                      {item.text}
                    </span>
                    {item.due_date && (
                      <div className={cn('flex items-center gap-1 mt-0.5', overdue ? 'text-red-600' : 'text-gray-400')}>
                        {overdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                        <span className="text-[11px] font-medium">{formatShortDate(item.due_date)}</span>
                        {canEdit && (
                          <button onClick={() => clearDate(item.id)} className="opacity-0 group-hover:opacity-100 ml-0.5 text-gray-400 hover:text-red-500 transition-all">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => { setEditingId(item.id); setEditingText(item.text); setEditingDate(item.due_date ?? '') }}
                        className="text-gray-400 hover:text-blue-500"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {canEdit && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Item; 15/10 — ou clique no 📅"
              value={newItemText}
              onChange={e => {
                setNewItemText(e.target.value)
                // Auto-open date picker when semicolon detected with a valid date part
                const parsed = parseChecklistInput(e.target.value)
                if (parsed.due_date) { setNewItemDate(parsed.due_date); setShowDateFor('new') }
                else if (!e.target.value.includes(';')) setShowDateFor(null)
              }}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="h-8 text-sm"
            />
            <button
              onClick={() => setShowDateFor(showDateFor === 'new' ? null : 'new')}
              className={cn('shrink-0 p-1.5 rounded-lg border transition-colors', showDateFor === 'new' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300')}
              title="Definir data"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <Button size="sm" variant="outline" onClick={addItem} disabled={adding || !newItemText.trim()} className="h-8 px-2 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showDateFor === 'new' && (
            <div className="flex items-center gap-2 ml-1">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <Input
                type="date"
                value={newItemDate}
                onChange={e => setNewItemDate(e.target.value)}
                className="h-7 text-xs w-36"
              />
              {newItemDate && (
                <button onClick={() => setNewItemDate('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
