import { useRef, useState } from 'react'
import { parseParts, parsePrices, parseVehicle } from '../lib/parseBudgetText'
import { parseSpreadsheetHtml, parseSpreadsheetTextGrid } from '../lib/parseSpreadsheetPaste'

export default function PasteArea({ onImport, onImportSpreadsheet }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  const analyze = (raw) => {
    const titleLine = parseVehicle(raw)
    const parts = parseParts(raw)
    const { storeName, items } = parsePrices(raw)
    const hasPrices = items.length > 0
    setPreview({ titleLine, partsCount: parts.length, hasPrices, storeName, pricesCount: items.length })
    return { titleLine, parts, storeName, items, hasPrices }
  }

  const handleChange = (val) => {
    setText(val)
    if (val.trim()) analyze(val)
    else setPreview(null)
  }

  const handleImport = () => {
    if (!text.trim()) return
    const parsed = analyze(text)
    onImport?.(text, parsed)
    setText('')
    setPreview(null)
  }

  const handleFileUpload = (file) => {
    if (!file) return
    const lowerName = file.name.toLowerCase()
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      alert('Arquivo XLS/XLSX ainda não é suportado. Exporte a planilha como CSV e tente novamente.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const raw = String(event.target?.result || '')
      setText(raw)
      if (raw.trim()) analyze(raw)
      else setPreview(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="glass rounded-xl mb-4 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-blue-800">Cole aqui a lista de pecas</p>
        <span className="text-xs text-blue-400 font-medium">
          O sistema detecta automaticamente o nome do veiculo
        </span>
      </div>

      <textarea
        className="w-full border border-blue-200 rounded-xl p-3 text-sm font-mono h-28 resize-none bg-white/80 focus:bg-white transition-all placeholder-gray-300"
        placeholder={`HB20 2023 PRATA SIL7D35 JOAO SILVA\nFiltro de oleo\nFiltro de ar\nCorreia dentada\nVelas de ignicao`}
        value={text}
        onPaste={handlePaste}
        onChange={e => handleChange(e.target.value)}
      />

      {preview && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {preview.titleLine && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Veiculo detectado: <strong>{preview.titleLine.substring(0, 40)}</strong>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {preview.hasPrices
              ? `${preview.pricesCount} preço(s) para importar${preview.storeName ? ` • loja: ${preview.storeName}` : ''}`
              : `${preview.partsCount} peca(s) para adicionar`}
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.tsv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
        />
        <button
          onClick={handleImport}
          className="btn-royal flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Importar orçamento
        </button>

        <label className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 font-medium transition-all cursor-pointer">
          Subir CSV/TSV
          <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFile} />
        </label>

        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 font-medium transition-all"
        >
          Subir planilha
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 font-medium transition-all"
        >
          Subir planilha
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 font-medium transition-all"
        >
          Subir planilha
        </button>
        <button
          onClick={() => { setText(''); setPreview(null) }}
          className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 font-medium transition-all"
        >Limpar</button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Dica: copie a tabela direto do Excel/Google Sheets e cole aqui para manter as cores de compra.
      </p>
      {sheetMsg && <p className="mt-1 text-xs font-medium text-emerald-700">{sheetMsg}</p>}
    </div>
  )
}
