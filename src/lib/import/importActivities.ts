import { createClient } from '@/lib/supabase/client'

export interface MappedRow {
  title: string
  due_date?: string | null
  follow_up_date?: string | null
  description?: string | null
  rich_notes?: string | null
  tag?: string | null
  status?: string | null
  priority?: string | null
  responsible_email?: string | null
  context?: string | null
}

export interface ImportResult {
  created: number
  skipped: number
  errors: string[]
  createdIds: string[]
}

const STATUS_MAP: Record<string, string> = {
  'todo': 'pendente', 'a fazer': 'pendente', 'pendente': 'pendente',
  'in_progress': 'em_andamento', 'em andamento': 'em_andamento', 'em_andamento': 'em_andamento',
  'done': 'concluida', 'concluído': 'concluida', 'concluida': 'concluida', 'concluída': 'concluida',
  'blocked': 'aguardando', 'bloqueado': 'aguardando', 'aguardando': 'aguardando',
  'cancelled': 'cancelada', 'cancelado': 'cancelada', 'cancelada': 'cancelada',
}

const PRIORITY_MAP: Record<string, string> = {
  'low': 'baixa', 'baixa': 'baixa',
  'medium': 'media', 'média': 'media', 'media': 'media',
  'high': 'alta', 'alta': 'alta',
  'urgent': 'urgente', 'urgente': 'urgente',
}

const CONTEXT_MAP: Record<string, string> = {
  'company': 'Empresa', 'empresa': 'Empresa',
  'family': 'Família', 'família': 'Família', 'familia': 'Família',
  'personal': 'Pessoal', 'pessoal': 'Pessoal',
}

export function normalizeStatus(v: string | null | undefined): string {
  if (!v) return 'pendente'
  return STATUS_MAP[v.toLowerCase().trim()] || 'pendente'
}

export function normalizePriority(v: string | null | undefined): string {
  if (!v) return 'media'
  return PRIORITY_MAP[v.toLowerCase().trim()] || 'media'
}

export function normalizeContext(v: string | null | undefined): string {
  if (!v) return ''
  return CONTEXT_MAP[v.toLowerCase().trim()] || v
}

export function parseDate(v: string | null | undefined): string | null {
  if (!v) return null
  const s = String(v).trim()

  // DD/MM/AAAA
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2,'0')}-${mdy[2].padStart(2,'0')}`

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // Excel serial number
  const num = Number(v)
  if (!isNaN(num) && num > 40000) {
    const d = new Date((num - 25569) * 86400 * 1000)
    return d.toISOString().slice(0, 10)
  }

  return null
}

const TAG_COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#84CC16']

export async function importActivities(
  rows: MappedRow[],
  entityId: string,
  userId: string
): Promise<ImportResult> {
  const supabase = createClient()
  const result: ImportResult = { created: 0, skipped: 0, errors: [], createdIds: [] }

  // 1. Coletar tags únicas
  const tagNames = Array.from(new Set(rows.map(r => r.tag?.trim()).filter(Boolean) as string[]))
  const tagMap: Record<string, string> = {}

  if (tagNames.length > 0) {
    const { data: existingTags } = await supabase
      .from('tags').select('id, name').eq('entity_id', entityId)
    for (const t of (existingTags || [])) tagMap[t.name.toLowerCase()] = t.id

    const newTags = tagNames.filter(n => !tagMap[n.toLowerCase()])
    if (newTags.length > 0) {
      const { data: created } = await supabase.from('tags').insert(
        newTags.map((name, i) => ({
          entity_id: entityId,
          name,
          color: TAG_COLORS[i % TAG_COLORS.length],
        }))
      ).select('id, name')
      for (const t of (created || [])) tagMap[t.name.toLowerCase()] = t.id
    }
  }

  // 2. Resolver responsáveis
  const emails = Array.from(new Set(rows.map(r => r.responsible_email?.trim().toLowerCase()).filter(Boolean) as string[]))
  const userMap: Record<string, string> = {}
  if (emails.length > 0) {
    const { data: users } = await supabase
      .from('user_profiles').select('id, email, full_name').eq('entity_id', entityId)
    for (const u of (users || [])) {
      userMap[u.email.toLowerCase()] = u.id
      userMap[u.full_name.toLowerCase()] = u.id
    }
  }

  // 3. Criar atividades em lote
  for (const row of rows) {
    if (!row.title?.trim()) { result.skipped++; continue }

    const responsibleId = row.responsible_email
      ? userMap[row.responsible_email.toLowerCase()] || null
      : null

    try {
      const { data: act, error } = await supabase.from('activities').insert({
        entity_id: entityId,
        title: row.title.trim(),
        description: row.description || null,
        rich_notes: row.rich_notes || null,
        due_date: parseDate(row.due_date) ? `${parseDate(row.due_date)}T00:00:00` : null,
        follow_up_date: parseDate(row.follow_up_date) ? `${parseDate(row.follow_up_date)}T00:00:00` : null,
        status: normalizeStatus(row.status) as 'pendente' | 'em_andamento' | 'concluida' | 'aguardando' | 'cancelada',
        priority: normalizePriority(row.priority) as 'baixa' | 'media' | 'alta' | 'urgente',
        context: normalizeContext(row.context) || null,
        responsible_id: responsibleId,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }).select('id').single()

      if (error || !act) { result.errors.push(`Erro ao criar "${row.title}": ${error?.message}`); continue }

      result.createdIds.push(act.id)

      // Vincular tag
      if (row.tag?.trim() && tagMap[row.tag.trim().toLowerCase()]) {
        await supabase.from('activity_tags').insert({
          activity_id: act.id,
          tag_id: tagMap[row.tag.trim().toLowerCase()],
        })
      }

      // Registrar histórico
      await supabase.from('activity_history').insert({
        activity_id: act.id,
        user_id: userId,
        field_changed: 'imported_from_excel',
        old_value: null,
        new_value: row.title,
      })

      result.created++
    } catch (e: any) {
      result.errors.push(`Erro inesperado em "${row.title}": ${e.message}`)
    }
  }

  return result
}
