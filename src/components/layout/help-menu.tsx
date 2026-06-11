'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, LayoutDashboard, ListTodo, CalendarDays, Building2, Users2, Tag, Settings2, Kanban, Bell, Upload, FileSpreadsheet, ChevronRight, CheckCircle2 } from 'lucide-react'

const helpTopics = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    color: 'text-blue-700 bg-blue-50',
    steps: [
      'Acesse o Dashboard pelo menu lateral (ícone de casa)',
      'Veja os 4 cards no topo: Total, Pendentes, Concluídas e Vencidas',
      'Clique em qualquer card para filtrar as atividades por aquele status',
      'Role a página para ver Retornos de Hoje, Atividades Vencidas e Próximos 7 Dias',
      'Use o dashboard como ponto de partida diário — ele mostra o que precisa de atenção',
    ],
  },
  {
    icon: ListTodo,
    title: 'Atividades',
    color: 'text-blue-600 bg-blue-50',
    steps: [
      'Clique em "Atividades" no menu lateral',
      'Use o botão "Nova Atividade" (canto superior direito) para criar uma tarefa',
      'Preencha título, responsável, prazo, prioridade e etiquetas',
      'Salve e a atividade aparecerá na lista',
      'Para editar, clique sobre a atividade para abrir os detalhes',
      'Altere o status clicando no campo de status dentro da atividade',
      'Use os filtros no topo para buscar por status, prioridade ou responsável',
    ],
  },
  {
    icon: Kanban,
    title: 'Kanban',
    color: 'text-indigo-600 bg-indigo-50',
    steps: [
      'Clique em "Kanban" no menu lateral',
      'Você verá colunas: Pendente, Em Andamento, Concluída, Cancelada',
      'Cada card representa uma atividade',
      'Arraste um card de uma coluna para outra para mudar o status automaticamente',
      'Clique em um card para ver os detalhes completos da atividade',
      'Use o Kanban para ter visão visual do fluxo de trabalho da equipe',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Calendário',
    color: 'text-green-600 bg-green-50',
    steps: [
      'Clique em "Calendário" no menu lateral',
      'Atividades com data de vencimento aparecem nos dias correspondentes',
      'Clique em uma data para ver as atividades daquele dia',
      'Use as setas para navegar entre os meses',
      'Atividades vencidas aparecem em vermelho, as de hoje em azul',
    ],
  },
  {
    icon: Building2,
    title: 'Entidades',
    color: 'text-orange-600 bg-orange-50',
    steps: [
      'Clique em "Entidades" no menu lateral (visível para admins)',
      'Lista as empresas ou grupos familiares do sistema',
      'Cada entidade tem seus próprios usuários e atividades separados',
      'Para criar uma nova entidade, acesse o painel de super admin (/admin)',
      'O super admin define qual usuário será o administrador de cada entidade',
    ],
  },
  {
    icon: Users2,
    title: 'Usuários',
    color: 'text-pink-600 bg-pink-50',
    steps: [
      'Clique em "Usuários" no menu lateral (visível para admins)',
      'Veja todos os membros da sua empresa ou grupo',
      'Papéis: Admin (acesso total), Editor (criar/editar) e Visualizador (somente leitura)',
      'Para adicionar alguém: o usuário deve se cadastrar no sistema primeiro',
      'Após o cadastro, o admin pode alterar o papel do usuário nesta tela',
    ],
  },
  {
    icon: Tag,
    title: 'Etiquetas',
    color: 'text-yellow-600 bg-yellow-50',
    steps: [
      'Clique em "Etiquetas" no menu lateral',
      'Clique em "Nova Etiqueta" para criar uma categoria',
      'Dê um nome (ex: "Urgente", "Cliente X") e escolha uma cor',
      'Salve a etiqueta',
      'Ao criar ou editar uma atividade, selecione a etiqueta desejada',
      'Use etiquetas para filtrar atividades por projeto ou categoria',
    ],
  },
  {
    icon: FileSpreadsheet,
    title: 'Importar Excel',
    color: 'text-emerald-600 bg-emerald-50',
    steps: [
      'Clique em "Importar Excel" no menu lateral',
      'Baixe o template clicando em "Baixar Template"',
      'Preencha a planilha com suas atividades seguindo o formato do template',
      'Volte ao sistema e clique em "Selecionar arquivo"',
      'Faça o mapeamento das colunas se necessário',
      'Clique em "Importar" para criar todas as atividades de uma vez',
    ],
  },
  {
    icon: Bell,
    title: 'Notificações',
    color: 'text-red-600 bg-red-50',
    steps: [
      'Clique no ícone de sino no cabeçalho para ver notificações recentes',
      'Para ativar alertas no navegador, clique no botão "Notificações" no cabeçalho',
      'Autorize o navegador quando ele pedir permissão',
      'Você receberá alertas sobre vencimentos, retornos agendados e delegações',
      'Os alertas aparecem mesmo com o sistema em segundo plano',
    ],
  },
  {
    icon: Upload,
    title: 'Foto de Perfil',
    color: 'text-cyan-600 bg-cyan-50',
    steps: [
      'Clique no seu avatar (foto/iniciais) no canto superior direito',
      'Selecione "Configurações & Perfil" no menu',
      'Na seção de Perfil, clique no ícone de câmera sobre o avatar',
      'Selecione uma foto do seu dispositivo (JPG, PNG ou WebP, máx. 2MB)',
      'A foto é enviada automaticamente e aparece em todo o sistema',
    ],
  },
  {
    icon: Settings2,
    title: 'Configurações',
    color: 'text-gray-600 bg-gray-50',
    steps: [
      'Clique no seu avatar no canto superior direito → Configurações & Perfil',
      'Na seção "Perfil": altere seu nome e veja seu e-mail',
      'Na seção "Estilo do Menu": escolha entre Menu Lateral ou Menu Superior',
      'Na seção "Alterar Senha": digite a nova senha duas vezes e salve',
      'As preferências de menu são salvas automaticamente no seu navegador',
    ],
  },
]

function HelpModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!mounted) return null

  const topic = helpTopics[selected]
  const Icon = topic.icon

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ background: 'white', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', width: '100%', maxWidth: '760px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle style={{ width: '20px', height: '20px', color: '#D97706' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Central de Ajuda</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Passo a passo de cada funcionalidade</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: '#6B7280', lineHeight: 1 }}
            title="Fechar (Esc)"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar topics */}
          <div style={{ width: '200px', borderRight: '1px solid #F3F4F6', overflowY: 'auto', padding: '8px', flexShrink: 0 }}>
            {helpTopics.map((t, i) => {
              const TIcon = t.icon
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    textAlign: 'left', fontSize: '13px', transition: 'all 0.15s',
                    background: selected === i ? '#EFF6FF' : 'transparent',
                    color: selected === i ? '#1D4ED8' : '#4B5563',
                    fontWeight: selected === i ? 600 : 400,
                    marginBottom: '2px',
                  }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: selected === i ? '#DBEAFE' : '#F9FAFB' }}>
                    <TIcon style={{ width: '14px', height: '14px' }} />
                  </div>
                  <span style={{ flex: 1 }}>{t.title}</span>
                  {selected === i && <ChevronRight style={{ width: '12px', height: '12px', opacity: 0.5 }} />}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className={topic.color}>
                <Icon style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>{topic.title}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{topic.steps.length} passos</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topic.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1D4ED8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.6 }}>{step}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '12px 14px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#2563EB', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#1D4ED8', margin: 0 }}>Selecione outro tópico ao lado para ver mais tutoriais</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function HelpMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', padding: '6px 10px', borderRadius: '10px',
          border: '1px solid #FCD34D', fontWeight: 600, cursor: 'pointer',
          background: '#FFFBEB', color: '#B45309', transition: 'all 0.15s',
        }}
        title="Abrir ajuda"
      >
        <HelpCircle style={{ width: '14px', height: '14px' }} />
        <span>Ajuda</span>
      </button>

      {open && <HelpModal onClose={() => setOpen(false)} />}
    </>
  )
}
