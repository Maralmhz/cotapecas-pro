import { useState } from 'react'

export default function ExportModal({ quotation, onClose }) {
  const [exporting, setExporting] = useState(false)

  const exportCSV = () => {
    const { parts, shops, prices } = quotation
    const header = ['#', 'Peca', ...shops.map(s => s.name), 'OBS']
    const rows = parts.map((part, i) => [
      i + 1,
      `"${part.name}"`,
      ...shops.map(shop => {
        const cell = prices[`${part.id}_${shop.id}`]
        return cell?.price ? parseFloat(cell.price).toFixed(2).replace('.', ',') : ''
      }),
      `"${part.obs || ''}"`
    ])
    // Totals row
    const totalsRow = ['', 'TOTAL', ...shops.map(shop => {
      const total = parts.reduce((acc, p) => {
        const cell = prices[`${p.id}_${shop.id}`]
        return acc + (cell?.price ? parseFloat(cell.price) : 0)
      }, 0)
      return total > 0 ? total.toFixed(2).replace('.', ',') : ''
    }), '']

    const csvLines = [
      `"${quotation.oficina ? quotation.oficina + ' | ' : ''}${quotation.title}"`,
      '',
      header.join(';'),
      ...rows.map(r => r.join(';')),
      totalsRow.join(';')
    ]
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cotacao_${(quotation.oficina || quotation.title || 'export').replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onClose()
  }

  const exportImage = async () => {
    setExporting(true)
    try {
      // Use browser print dialog for best quality
      const printContent = buildPrintHTML(quotation)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(printContent)
        win.document.close()
        win.focus()
        setTimeout(() => {
          win.print()
          setExporting(false)
        }, 800)
      }
    } catch (e) {
      console.error(e)
      setExporting(false)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-80"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-blue-900 mb-1">Exportar Cotacao</h3>
        <p className="text-sm text-gray-500 mb-5">
          {quotation.oficina && <><strong>{quotation.oficina}</strong> &mdash; </>}
          {quotation.title}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Planilha Excel / CSV</div>
              <div className="text-xs text-gray-400">Abre no Excel, Google Sheets...</div>
            </div>
          </button>

          <button
            onClick={exportImage}
            disabled={exporting}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{exporting ? 'Gerando...' : 'Imagem / PDF'}</div>
              <div className="text-xs text-gray-400">Salvar como PDF ou imprimir</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
        >Cancelar</button>
      </div>
    </div>
  )
}

function buildPrintHTML(q) {
  const { parts, shops, prices } = q
  const fmtBRL = v => {
    const n = parseFloat(v)
    return isNaN(n) ? '' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  const shopCols = shops.map(s => `<th style="background:#1e3a8a;color:#fff;padding:6px 10px;min-width:100px">${s.name}</th>`).join('')
  const partRows = parts.map((p, i) => {
    const cells = shops.map(shop => {
      const cell = prices[`${p.id}_${shop.id}`] || {}
      const bg = cell.isPurchased ? '#d1fae5' : (i % 2 === 0 ? '#f8faff' : '#fff')
      return `<td style="padding:5px 10px;background:${bg};text-align:right">${cell.price ? fmtBRL(cell.price) : ''}</td>`
    }).join('')
    return `<tr><td style="padding:5px 10px;background:${i%2===0?'#f8faff':'#fff'};color:#6b7faa;text-align:center">${i+1}</td><td style="padding:5px 10px;background:${i%2===0?'#f8faff':'#fff'}">${p.name}</td>${cells}<td style="padding:5px 10px;background:${i%2===0?'#f8faff':'#fff'};color:#9ca3af;font-style:italic">${p.obs||''}</td></tr>`
  }).join('')
  const totCells = shops.map(s => {
    const t = parts.reduce((acc,p)=>{ const c=prices[`${p.id}_${s.id}`]; return acc+(c?.price?parseFloat(c.price):0) },0)
    return `<td style="padding:6px 10px;text-align:right;font-weight:bold;background:#e8f0fc">${t>0?fmtBRL(t):''}</td>`
  }).join('')
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cotacao</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%}@media print{body{margin:0}}</style></head><body><h2 style="color:#1e3a8a;margin-bottom:4px">${q.oficina?`${q.oficina} &mdash; `:''} ${q.title}</h2><p style="color:#666;margin-bottom:16px;font-size:13px">Cotacao de Pecas Automotivas</p><table><thead><tr><th style="background:#1e3a8a;color:#fff;padding:6px 10px">#</th><th style="background:#1e3a8a;color:#fff;padding:6px 10px;text-align:left">Peca</th>${shopCols}<th style="background:#1e3a8a;color:#fff;padding:6px 10px">OBS</th></tr></thead><tbody>${partRows}<tr><td colspan="2" style="padding:6px 10px;font-weight:bold;background:#e8f0fc">TOTAL</td>${totCells}<td style="background:#e8f0fc"></td></tr></tbody></table></body></html>`
}
