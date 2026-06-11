export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      entities: {
        Row: {
          id: string
          name: string
          type: 'empresa' | 'familia' | 'pessoa_fisica'
          document: string | null
          email: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'empresa' | 'familia' | 'pessoa_fisica'
          document?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'empresa' | 'familia' | 'pessoa_fisica'
          document?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          entity_id: string | null
          full_name: string
          email: string
          role: 'admin' | 'editor' | 'visualizador'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          entity_id?: string | null
          full_name: string
          email: string
          role?: 'admin' | 'editor' | 'visualizador'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          entity_id?: string | null
          full_name?: string
          email?: string
          role?: 'admin' | 'editor' | 'visualizador'
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          entity_id: string | null
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          entity_id?: string | null
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          entity_id: string | null
          title: string
          description: string | null
          context: string | null
          responsible_id: string | null
          delegated_to_id: string | null
          priority: 'urgente' | 'alta' | 'media' | 'baixa'
          status: 'pendente' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
          rich_notes: string | null
          due_date: string | null
          follow_up_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entity_id?: string | null
          title: string
          description?: string | null
          context?: string | null
          responsible_id?: string | null
          delegated_to_id?: string | null
          priority?: 'urgente' | 'alta' | 'media' | 'baixa'
          status?: 'pendente' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
          rich_notes?: string | null
          due_date?: string | null
          follow_up_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          context?: string | null
          responsible_id?: string | null
          delegated_to_id?: string | null
          priority?: 'urgente' | 'alta' | 'media' | 'baixa'
          status?: 'pendente' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada'
          rich_notes?: string | null
          due_date?: string | null
          follow_up_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_tags: {
        Row: {
          activity_id: string
          tag_id: string
        }
        Insert: {
          activity_id: string
          tag_id: string
        }
        Update: {
          activity_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          activity_id: string
          text: string
          completed: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          text: string
          completed?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          text?: string
          completed?: boolean
          order_index?: number
        }
        Relationships: []
      }
      activity_history: {
        Row: {
          id: string
          activity_id: string
          user_id: string | null
          field_changed: string | null
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id?: string | null
          field_changed?: string | null
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          field_changed?: string | null
          old_value?: string | null
          new_value?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          type: 'vencimento' | 'follow_up' | 'delegacao' | 'atualizacao'
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          type: 'vencimento' | 'follow_up' | 'delegacao' | 'atualizacao'
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
