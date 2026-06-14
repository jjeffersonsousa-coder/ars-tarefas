'use client'

import { Activity } from './types'
import { PRIORITY_LABELS, STATUS_LABELS } from './types'

const PRIMARY = '#006494'
const DARK = '#13293D'
const LIGHT = '#E8F1F2'

function fmtDate(iso?: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// jsPDF Helvetica doesn't support accented chars — replace for PDF only
function pdf(text: string): string {
  return text
    .replace(/[áàâã]/g, 'a').replace(/[ÁÀÂÃ]/g, 'A')
    .replace(/[éèê]/g, 'e').replace(/[ÉÈÊ]/g, 'E')
    .replace(/[íìî]/g, 'i').replace(/[ÍÌÎ]/g, 'I')
    .replace(/[óòôõ]/g, 'o').replace(/[ÓÒÔÕ]/g, 'O')
    .replace(/[úùû]/g, 'u').replace(/[ÚÙÛ]/g, 'U')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
}

export async function exportToExcel(activities: Activity[], filename = 'atividades') {
  const { utils, writeFile } = await import('xlsx')

  const rows = activities.map((a, i) => ({
    '#': i + 1,
    'Título': a.title,
    'Descrição': a.description || '',
    'Contexto': a.context || '',
    'Prioridade': PRIORITY_LABELS[a.priority],
    'Status': STATUS_LABELS[a.status],
    'Responsável': (a.responsible as { full_name?: string } | null)?.full_name || '',
    'Delegado para': (a.delegated_to as { full_name?: string } | null)?.full_name || '',
    'Vencimento': fmtDate(a.due_date),
    'Follow-up': fmtDate(a.follow_up_date),
    'Data de Conclusão': a.status === 'concluida' ? fmtDate(a.updated_at) : '',
    'Criado em': fmtDate(a.created_at),
  }))

  const ws = utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 4 }, { wch: 40 }, { wch: 30 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
  ]

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Atividades')
  writeFile(wb, `${filename}.xlsx`)
}

export async function exportToPDF(activities: Activity[], title = 'Relatório de Atividades') {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(DARK)
  doc.rect(0, 0, W, 28, 'F')

  // Accent bar
  doc.setFillColor(PRIMARY)
  doc.rect(0, 28, W, 3, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ARS', 14, 13)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Gerenciamento de Atividades e Rotinas', 14, 20)

  // Report title right side
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(pdf(title), W - 14, 13, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - 14, 20, { align: 'right' })

  // Summary chips
  const total = activities.length
  const concluidas = activities.filter(a => a.status === 'concluida').length
  const pendentes = activities.filter(a => a.status === 'pendente').length
  const vencidas = activities.filter(a => a.due_date && new Date(a.due_date) < new Date() && a.status !== 'concluida' && a.status !== 'cancelada').length

  const chips = [
    { label: 'Total', value: total, color: DARK },
    { label: 'Concluídas', value: concluidas, color: '#16A34A' },
    { label: 'Pendentes', value: pendentes, color: '#D97706' },
    { label: 'Vencidas', value: vencidas, color: '#DC2626' },
  ]

  let cx = 14
  chips.forEach(chip => {
    const [r, g, b] = hexToRgb(chip.color)
    doc.setFillColor(r, g, b)
    doc.roundedRect(cx, 34, 40, 14, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(String(chip.value), cx + 20, 43, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(chip.label, cx + 20, 46.5, { align: 'center' })
    cx += 44
  })

  // Table
  const STATUS_LABELS_PDF: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    aguardando: 'Aguardando',
    concluida: 'Concluida',
    cancelada: 'Cancelada',
  }

  const PRIORITY_LABELS_PDF: Record<string, string> = {
    urgente: 'Urgente',
    alta: 'Alta',
    media: 'Media',
    baixa: 'Baixa',
  }

  autoTable(doc, {
    startY: 52,
    head: [['#', 'Titulo', 'Contexto', 'Prioridade', 'Status', 'Responsavel', 'Vencimento', 'Conclusao']],
    body: activities.map((a, i) => [
      i + 1,
      pdf(a.title),
      pdf(a.context || '-'),
      PRIORITY_LABELS_PDF[a.priority] || a.priority,
      STATUS_LABELS_PDF[a.status] || a.status,
      pdf((a.responsible as { full_name?: string } | null)?.full_name || '-'),
      fmtDate(a.due_date),
      a.status === 'concluida' ? fmtDate(a.updated_at) : '-',
    ]),
    headStyles: {
      fillColor: hexToRgb(PRIMARY),
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: hexToRgb(LIGHT),
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: [30, 40, 50],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 36 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 38 },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const status = activities[data.row.index]?.status
        const colors: Record<string, [number, number, number]> = {
          concluida: [22, 163, 74],
          em_andamento: [37, 99, 235],
          pendente: [107, 114, 128],
          aguardando: [217, 119, 6],
          cancelada: [220, 38, 38],
        }
        if (colors[status]) {
          const [r, g, b] = colors[status]
          doc.setFillColor(r, g, b)
          const pad = 2
          doc.roundedRect(
            data.cell.x + pad,
            data.cell.y + pad,
            data.cell.width - pad * 2,
            data.cell.height - pad * 2,
            1.5, 1.5, 'F'
          )
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.text(
            STATUS_LABELS_PDF[status] || status,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 0.5,
            { align: 'center', baseline: 'middle' }
          )
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const pages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const h = doc.internal.pageSize.getHeight()
    doc.setFillColor(...hexToRgb(DARK))
    doc.rect(0, h - 10, W, 10, 'F')
    doc.setTextColor(200, 215, 225)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('ARS - Gerenciamento de Atividades e Rotinas', 14, h - 3.5)
    doc.text(`Página ${p} de ${pages}`, W - 14, h - 3.5, { align: 'right' })
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}
