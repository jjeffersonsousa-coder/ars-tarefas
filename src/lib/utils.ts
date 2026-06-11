import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  const hasTime = typeof date === 'string' && /T\d{2}:\d{2}/.test(date) && !date.endsWith('T00:00:00.000Z')
  return hasTime
    ? format(d, "dd/MM 'às' HH:mm", { locale: ptBR })
    : format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  const d = parseISO(date)
  return isBefore(d, new Date()) && !isToday(d)
}

export function isDueToday(date: string | null | undefined): boolean {
  if (!date) return false
  return isToday(parseISO(date))
}

export function isDueSoon(date: string | null | undefined): boolean {
  if (!date) return false
  const d = parseISO(date)
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  return isAfter(d, new Date()) && isBefore(d, threeDaysFromNow)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
