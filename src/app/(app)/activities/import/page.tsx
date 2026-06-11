'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, FileSpreadsheet, ChevronRight, Download, CheckCircle2, AlertTriangle, XCircle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { importActivities, MappedRow, parseDate, normalizeStatus, normalizePriority, normalizeContext, ImportResult } from '@/lib/import/importActivities'
import Link from 'next/link'

const SYSTEM_FIELDS = [
  { key: 'title',             label: 'Título',                required: true },
  { key: 'due_date',          label: 'Data de Vencimento',    required: false },
  { key: 'follow_up_date',    label: 'Data de Retorno',       required: false },
  { key: 'description',       label: 'Observação',            required: false },
  { key: 'rich_notes',        label: 'Anotações',             required: false },
  { key: 'tag',               label: 'Tag',                   required: false },
  { key: 'status',            label: 'Status',                required: false },
  { key: 'priority',          label: 'Prioridade',            required: false },
  { key: 'responsible_email', label: 'Responsável (e-mail)',  required: false },
  { key: 'context',           label: 'Contexto',              required: false },
] as const

type FieldKey = typeof SYSTEM_FIELDS[number]['key']

type Step = 1 | 2 | 3

interface RowValidation {
  row: MappedRow
  status: 'valid' | 'warning' | 'error'
  messages: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [dragging, setDragging] = useState(false)
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const [validations, setValidations] = useState<RowValidation[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (!p || (p.role !== 'admin' && p.role !== 'editor')) { router.replace('/activities'); return }
          setProfile(p as UserProfile)
        })
    })
  }, [])

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      if (json.length === 0) { toast.error('Planilha vazia ou inválida'); return }
      setRawData(json)
      setHeaders(Object.keys(json[0]))
      setFileName(file.name)
      setStep(2)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function getMappedRows(): MappedRow[] {
    return rawData.map(row => {
      const get = (field: FieldKey) => mapping[field] ? String(row[mapping[field]!] || '') : ''
      return {
        title: get('title'),
        due_date: get('due_date') || null,
        follow_up_date: get('follow_up_date') || null,
        description: get('description') || null,
        rich_notes: get('rich_notes') || null,
        tag: get('tag') || null,
        status: get('status') || null,
        priority: get('priority') || null,
        responsible_email: get('responsible_email') || null,
        context: get('context') || null,
      }
    })
  }

  function goToStep3() {
    if (!mapping.title) { toast.error('Mapeie o campo "Título" antes de continuar'); return }
    const rows = getMappedRows()
    const vld: RowValidation[] = rows.map((row, i) => {
      const msgs: string[] = []
      let status: RowValidation['status'] = 'valid'
      if (!row.title?.trim()) { msgs.push('Título vazio — linha será ignorada'); status = 'error' }
      if (row.due_date && !parseDate(row.due_date)) { msgs.push('Data de vencimento em formato inválido'); if (status !== 'error') status = 'warning' }
      if (row.follow_up_date && !parseDate(row.follow_up_date)) { msgs.push('Data de retorno em formato inválido'); if (status !== 'error') status = 'warning' }
      if (row.tag?.trim()) msgs.push(`Tag "${row.tag}" pode ser criada automaticamente`)
      return { row, status, messages: msgs }
    })
    setValidations(vld)
    setStep(3)
  }

  async function handleImport() {
    if (!profile) return
    setImporting(true)
    const validRows = validations.filter(v => v.status !== 'error').map(v => v.row)
    try {
      const res = await importActivities(validRows, profile.entity_id || '', profile.id)
      setResult(res)
      toast.success(`${res.created} atividades importadas!`)
    } catch (e: any) {
      toast.error('Erro na importação', { description: e.message })
    }
    setImporting(false)
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Título','Data de vencimento','Data de retorno','Observação','Anotações','Tag','Status','Prioridade','Responsável','Contexto'],
      ['Reunião de alinhamento','25/06/2025','26/06/2025','Alinhar metas do trimestre','Levar apresentação PPT','Reuniões','Em andamento','Alta','joao@empresa.com','Empresa'],
      ['Pagar fornecedor','20/06/2025','','NF 1234 - Valor R$ 3.500','','Financeiro','A fazer','Urgente','','Empresa'],
      ['Aniversário da Ana','30/06/2025','28/06/2025','Comprar presente','Ela gosta de livros','Família','A fazer','Média','','Família'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Atividades')
    XLSX.writeFile(wb, 'modelo-importacao-ars.xlsx')
  }

  const STEP_LABEL = ['Upload do Arquivo', 'Mapeamento de Colunas', 'Revisão e Importação']
  const mappedRows = step >= 2 ? getMappedRows() : []
  const preview = mappedRows.slice(0, 3)
  const skipped = validations.filter(v => v.status === 'error').length
  const warnings = validations.filter(v => v.status === 'warning').length
  const valid = validations.filter(v => v.status === 'valid').length

  if (!profile) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/activities"><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar via Excel</h1>
          <p className="text-gray-500 text-sm">Importe atividades em lote a partir de uma planilha .xlsx ou .csv</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="ml-auto rounded-xl gap-2">
          <Download className="h-3.5 w-3.5" />Planilha Modelo
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEP_LABEL.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn('flex items-center gap-2 text-sm font-medium', step === i + 1 ? 'text-violet-700' : step > i + 1 ? 'text-emerald-600' : 'text-gray-400')}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                step === i + 1 ? 'border-violet-600 bg-violet-600 text-white' :
                step > i + 1 ? 'border-emerald-500 bg-emerald-500 text-white' :
                'border-gray-300 text-gray-400'
              )}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < 2 && <div className={cn('flex-1 h-0.5 rounded', step > i + 1 ? 'bg-emerald-400' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer',
              dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
            )}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Arraste sua planilha aqui</p>
            <p className="text-gray-400 text-sm mt-1">ou clique para selecionar o arquivo</p>
            <p className="text-gray-300 text-xs mt-3">Suporta .xlsx e .csv • Máximo 500 linhas</p>
            <input id="file-input" type="file" accept=".xlsx,.csv" onChange={handleFileInput} className="hidden" />
          </div>
          <p className="text-center text-sm text-gray-400">
            Não tem planilha?{' '}
            <button onClick={downloadTemplate} className="text-violet-600 underline font-medium">Baixe o modelo</button>
          </p>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-semibold text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-400">{rawData.length} linhas detectadas · {headers.length} colunas</p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 text-sm mb-3">Mapeamento de campos</h3>
            <div className="space-y-2">
              {SYSTEM_FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 text-sm text-gray-600 flex items-center gap-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                  </div>
                  <select
                    value={mapping[key] || ''}
                    onChange={(e) => setMapping(m => ({ ...m, [key]: e.target.value || undefined }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <option value="">— Não importar —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {mapping.title && preview.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">Pré-visualização (primeiras {preview.length} linhas)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {SYSTEM_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} className="text-left text-gray-400 font-medium pb-2 pr-4">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {SYSTEM_FIELDS.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} className="py-2 pr-4 text-gray-700 max-w-[160px] truncate">
                            {row[f.key as keyof MappedRow] || <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Voltar</Button>
            <Button onClick={goToStep3} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl gap-2">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && !result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Válidas', value: valid, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { label: 'Com aviso', value: warnings, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { label: 'Ignoradas', value: skipped, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={cn('rounded-2xl border p-4 flex items-center gap-3', color)}>
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-2xl font-bold leading-none">{value}</p>
                  <p className="text-xs font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">{validations.length} linhas para revisão</p>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-gray-400 font-medium px-4 py-2 w-8">#</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2">Título</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2">Status</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2">Prioridade</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2">Vencimento</th>
                    <th className="text-left text-gray-400 font-medium px-4 py-2 w-48">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {validations.map((v, i) => (
                    <tr key={i} className={cn(v.status === 'error' && 'bg-red-50/40', v.status === 'warning' && 'bg-amber-50/30')}>
                      <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800 max-w-[200px] truncate">{v.row.title || <span className="text-red-400 italic">Vazio</span>}</td>
                      <td className="px-4 py-2 text-gray-600">{v.row.status || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{v.row.priority || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{v.row.due_date || '—'}</td>
                      <td className="px-4 py-2">
                        {v.status === 'valid' && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Válida</span>}
                        {v.status === 'error' && <span className="text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />{v.messages[0]}</span>}
                        {v.status === 'warning' && <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{v.messages[0]}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">Voltar</Button>
            <Button
              onClick={handleImport}
              disabled={importing || valid + warnings === 0}
              className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl gap-2 px-8"
            >
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" />Importando...</> : <><Upload className="h-4 w-4" />Importar {valid + warnings} atividades</>}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importação concluída!</h2>
            <p className="text-gray-500 text-sm mt-1">{result.created} atividades criadas com sucesso</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-emerald-50 rounded-xl p-3"><p className="text-2xl font-bold text-emerald-600">{result.created}</p><p className="text-gray-500">Criadas</p></div>
            <div className="bg-amber-50 rounded-xl p-3"><p className="text-2xl font-bold text-amber-600">{result.skipped}</p><p className="text-gray-500">Ignoradas</p></div>
            <div className="bg-red-50 rounded-xl p-3"><p className="text-2xl font-bold text-red-600">{result.errors.length}</p><p className="text-gray-500">Erros</p></div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 text-left text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setStep(1); setResult(null); setRawData([]); setMapping({}) }} className="rounded-xl">
              Nova Importação
            </Button>
            <Button asChild className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
              <Link href="/activities">Ver Atividades</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
