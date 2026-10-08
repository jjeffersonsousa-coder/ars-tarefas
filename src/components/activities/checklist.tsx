'use client'

import { useState } from 'react'
import { ChecklistItem } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistProps {
  activityId: string
  items: ChecklistItem[]
  canEdit?: boolean
  onUpdate?: () => void
}

export function Checklist({ activityId, items: initialItems, canEdit = false, onUpdate }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    [...initialItems].sort((a, b) => a.order_index - b.order_index)
  )
  const [newItemText, setNewItemText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  async function saveEdit(itemId: string) {
    if (!editingText.trim()) { setEditingId(null); return }
    await supabase.from('checklist_items').update({ text: editingText.trim() }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, text: editingText.trim() } : i))
    setEditingId(null)
    onUpdate?.()
  }
  const supabase = createClient()

  const completedCount = items.filter((i) => i.completed).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  async function toggleItem(item: ChecklistItem) {
    const newCompleted = !item.completed
    await supabase
      .from('checklist_items')
      .update({ completed: newCompleted })
      .eq('id', item.id)
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: newCompleted } : i))
    )
    onUpdate?.()
  }

  async function addItem() {
    if (!newItemText.trim()) return
    setAdding(true)
    const { data } = await supabase
      .from('checklist_items')
      .insert({
        activity_id: activityId,
        text: newItemText.trim(),
        order_index: items.length,
        completed: false,
      })
      .select()
      .single()
    if (data) {
      setItems((prev) => [...prev, data as ChecklistItem])
      setNewItemText('')
    }
    setAdding(false)
    onUpdate?.()
  }

  async function deleteItem(itemId: string) {
    await supabase.from('checklist_items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
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
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => canEdit && editingId !== item.id ? toggleItem(item) : undefined}
              disabled={!canEdit || editingId === item.id}
            />
            {editingId === item.id ? (
              <>
                <Input
                  autoFocus
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                  className="h-7 text-sm flex-1"
                />
                <button onClick={() => saveEdit(item.id)} className="text-green-600 hover:text-green-700"><Check className="h-3.5 w-3.5" /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <span className={cn('flex-1 text-sm', item.completed ? 'line-through text-gray-400' : 'text-gray-700')}>
                  {item.text}
                </span>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingId(item.id); setEditingText(item.text) }} className="text-gray-400 hover:text-blue-500">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Adicionar item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={addItem}
            disabled={adding || !newItemText.trim()}
            className="h-8 px-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
