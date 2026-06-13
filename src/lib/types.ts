export type EntityType = 'empresa' | 'familia' | 'pessoa_fisica'
export type UserRole = 'admin' | 'editor' | 'visualizador'
export type Priority = 'urgente' | 'alta' | 'media' | 'baixa'
export type ActivityStatus = 'pendente' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
export type NotificationType = 'vencimento' | 'follow_up' | 'delegacao' | 'atualizacao'

export interface Entity {
  id: string
  name: string
  type: EntityType
  document?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  entity_id: string
  name: string
  description?: string | null
  created_at: string
}

export interface UserProfile {
  id: string
  entity_id?: string | null
  full_name: string
  email: string
  role: UserRole
  cargo?: string | null
  avatar_url?: string | null
  department_id?: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  entity_id?: string | null
  name: string
  color: string
  created_at: string
}

export interface Activity {
  id: string
  entity_id?: string | null
  title: string
  description?: string | null
  context?: string | null
  responsible_id?: string | null
  delegated_to_id?: string | null
  priority: Priority
  status: ActivityStatus
  rich_notes?: string | null
  due_date?: string | null
  follow_up_date?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  // Joined fields
  responsible?: UserProfile | null
  delegated_to?: UserProfile | null
  tags?: Tag[]
  checklist_items?: ChecklistItem[]
}

export interface ActivityTag {
  activity_id: string
  tag_id: string
}

export interface ChecklistItem {
  id: string
  activity_id: string
  text: string
  completed: boolean
  order_index: number
  created_at: string
}

export interface ActivityHistory {
  id: string
  activity_id: string
  user_id?: string | null
  field_changed?: string | null
  old_value?: string | null
  new_value?: string | null
  created_at: string
  user?: UserProfile | null
}

export interface Notification {
  id: string
  user_id: string
  activity_id: string
  type: NotificationType
  message: string
  read: boolean
  created_at: string
  activity?: Activity | null
}

export interface ActivityFilters {
  context?: string
  responsible_id?: string
  tag_ids?: string[]
  status?: ActivityStatus[]
  priority?: Priority[]
  due_date_from?: string
  due_date_to?: string
  search?: string
}

export interface DashboardStats {
  total: number
  overdue: number
  dueToday: number
  inProgress: number
  completed: number
  pending: number
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgente: 'bg-red-100 text-red-800 border-red-200',
  alta: 'bg-orange-100 text-orange-800 border-orange-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  baixa: 'bg-green-100 text-green-800 border-green-200',
}

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  aguardando: 'Aguardando',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  pendente: 'bg-gray-100 text-gray-800 border-gray-200',
  em_andamento: 'bg-blue-100 text-blue-800 border-blue-200',
  aguardando: 'bg-amber-100 text-amber-800 border-amber-200',
  concluida: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  empresa: 'Empresa',
  familia: 'Família',
  pessoa_fisica: 'Pessoa Física',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visualizador: 'Visualizador',
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  vencimento: 'Vencimento',
  follow_up: 'Follow-up',
  delegacao: 'Delegação',
  atualizacao: 'Atualização',
}
