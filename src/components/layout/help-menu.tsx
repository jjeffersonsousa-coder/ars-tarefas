'use client'

import { useState } from 'react'
import { HelpCircle, X, LayoutDashboard, ListTodo, CalendarDays, Building2, Users2, Tag, Settings2, Kanban, Bell, Upload, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'

const helpTopics = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    color: 'text-violet-600 bg-violet-50',
    description: 'Visão geral do sistema. Mostra estatísticas de atividades (total, pendentes, concluídas, vencidas). Clique em um card para filtrar as atividades. Seções especiais: Retornos de Hoje, Vencidas e Próximos 7 Dias.',
  },
  {
    icon: ListTodo,
    title: 'Atividades',
    color: 'text-blue-600 bg-blue-50',
    description: 'Lista todas as atividades da sua empresa. Alterne entre visualização em Lista ou Kanban. Use filtros por status, prioridade e responsável. Crie novas atividades pelo botão "Nova Atividade" ou digitando no campo rápido.',
  },
  {
    icon: Kanban,
    title: 'Kanban',
    color: 'text-indigo-600 bg-indigo-50',
    description: 'Visualização em quadro Kanban com colunas por status. Arraste e solte atividades entre colunas para atualizar o status automaticamente. Ideal para gestão visual do fluxo de trabalho.',
  },
  {
    icon: CalendarDays,
    title: 'Calendário',
    color: 'text-green-600 bg-green-50',
    description: 'Visualize atividades por data de vencimento em formato de calendário. Clique em uma data para ver as atividades do dia. Navegue entre meses com as setas.',
  },
  {
    icon: Building2,
    title: 'Entidades',
    color: 'text-orange-600 bg-orange-50',
    description: 'Empresas e grupos familiares cadastrados no sistema. Cada entidade tem seus próprios usuários e atividades. Apenas o super admin pode criar novas entidades.',
  },
  {
    icon: Users2,
    title: 'Usuários',
    color: 'text-pink-600 bg-pink-50',
    description: 'Gerencie os membros da sua empresa. Papéis disponíveis: Admin (acesso total), Editor (criar/editar atividades) e Visualizador (somente leitura). Convide novos membros pelo e-mail.',
  },
  {
    icon: Tag,
    title: 'Etiquetas',
    color: 'text-yellow-600 bg-yellow-50',
    description: 'Crie etiquetas coloridas para categorizar atividades. Exemplos: "Urgente", "Cliente X", "Financeiro". Use para filtrar e organizar atividades por projeto ou categoria.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Importar Excel',
    color: 'text-emerald-600 bg-emerald-50',
    description: 'Importe atividades em massa via planilha Excel (.xlsx) ou CSV. O assistente de importação permite mapear as colunas da sua planilha para os campos do sistema. Baixe o template para ver o formato esperado.',
  },
  {
    icon: Bell,
    title: 'Notificações',
    color: 'text-red-600 bg-red-50',
    description: 'Ative notificações do navegador para receber alertas sobre vencimentos, retornos agendados e delegações. Clique no sino no cabeçalho para ver notificações recentes.',
  },
  {
    icon: Upload,
    title: 'Foto de Perfil',
    color: 'text-cyan-600 bg-cyan-50',
    description: 'Acesse Configurações para enviar sua foto de perfil. Clique no avatar no canto superior direito → Configurações. Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.',
  },
  {
    icon: Settings2,
    title: 'Configurações',
    color: 'text-gray-600 bg-gray-50',
    description: 'Atualize seu nome, e-mail, senha e foto de perfil. Escolha entre menu lateral ou menu superior. Configure preferências de notificação.',
  },
]

export function HelpMenu() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        title="Ajuda"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:block">Ajuda</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Central de Ajuda</h2>
                  <p className="text-xs text-gray-500">Como usar cada funcionalidade do ARS</p>
                </div>
              </div>
              <button onClick={() => { setOpen(false); setSelected(null) }} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Topics list */}
              <div className="w-48 border-r overflow-y-auto p-2 shrink-0">
                {helpTopics.map((topic, i) => {
                  const Icon = topic.icon
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all',
                        selected === i ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center shrink-0', topic.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {topic.title}
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selected === null ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <p className="font-semibold text-gray-700">Selecione um tópico</p>
                    <p className="text-sm text-gray-400">Escolha uma funcionalidade ao lado para ver o passo a passo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', helpTopics[selected].color)}>
                        {(() => { const Icon = helpTopics[selected].icon; return <Icon className="h-5 w-5" /> })()}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{helpTopics[selected].title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-sm">{helpTopics[selected].description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
