import { useState, useRef, useCallback, useMemo } from 'react'
import EditableCell from './EditableCell'

const fmtMoney = (v, currency = 'BRL') => {
  const n = parseFloat(String(v).replace(',', '.'))
  if (isNaN(n) || !v) return ''
  return n.toLocaleString('pt-BR', { style: 'currency', currency })
}

export default function SpreadsheetTable({
  quotation, onAddPart, onRemovePart, onUpdatePart,
  onAddShop, onRemoveShop, onUpdateShopName, onUpdatePrice, onCellClick, settings
}) {
  const { parts, shops, prices } = quotation
  const [editingShop, setEditingShop] = useState(null)
  const [filter, setFilter] = useState('')
  const priceCellRefs = useRef({})

  const currency = settings?.currency || 'BRL'
  const showEconomyPercent = settings?.showEconomyPercent ?? true
  const showCodeColumn = settings?.showCodeColumn ?? true
  const showQuantityColumn = settings?.showQuantityColumn ?? true
  const showZeroValues = settings?.showZeroValues ?? true

  const filteredParts = useMemo(() => {
    if (!filter.trim()) return parts
    const q = filter.trim().toLowerCase()
    return parts.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q)
    )
  }, [parts, filter])

  const focusPriceCell = useCallback((partId, shopId, edit = true) => {
    const key = `${partId}_${shopId}`
    const cellRef = priceCellRefs.current[key]
    if (!cellRef) return

    if (edit) {
      cellRef.startEdit?.()
      return
    }

    cellRef.focus?.()
  }, [])

  const focusCell = useCallback((partId, shopIdx, direction) => {
    const currentRowIdx = filteredParts.findIndex(part => part.id === partId)
    if (currentRowIdx < 0) return

    if (direction === 'enter') {
      const nextRow = filteredParts[currentRowIdx + 1]
      const targetShop = shops[shopIdx]
      if (nextRow && targetShop) focusPriceCell(nextRow.id, targetShop.id)
      return
    }

    if (direction === 'tab') {
      const nextShop = shops[shopIdx + 1]
      if (nextShop) {
        focusPriceCell(filteredParts[currentRowIdx].id, nextShop.id)
        return
      }

      const nextRow = filteredParts[currentRowIdx + 1]
      const firstShop = shops[0]
      if (nextRow && firstShop) focusPriceCell(nextRow.id, firstShop.id)
      return
    }

    if (direction === 'shift-tab') {
      const prevShop = shops[shopIdx - 1]
      if (prevShop) {
        focusPriceCell(filteredParts[currentRowIdx].id, prevShop.id)
        return
      }

      const prevRow = filteredParts[currentRowIdx - 1]
      const lastShop = shops[shops.length - 1]
      if (prevRow && lastShop) focusPriceCell(prevRow.id, lastShop.id)
    }
  }, [filteredParts, shops, focusPriceCell])

  const totals = shops.map(shop => {
    let total = 0; let count = 0
    parts.forEach(part => {
      const qty = parseFloat(part.quantity) || 1
      const cell = prices[`${part.id}_${shop.id}`]
      if (cell?.price) { total += (parseFloat(String(cell.price).replace(',', '.')) || 0) * qty; count++ }
    })
    return { shopId: shop.id, total, count }
  })

  const bestShopIdx = totals.length > 0
    ? totals.reduce((bi, t, i) => t.total > 0 && (totals[bi].total === 0 || t.total < totals[bi].total) ? i : bi, 0)
    : -1

  const purchasedTotal = parts.reduce((acc, part) => {
    const qty = parseFloat(part.quantity) || 1
    shops.forEach(shop => {
      const cell = prices[`${part.id}_${shop.id}`]
      if (cell?.isPurchased && cell?.price) acc += (parseFloat(String(cell.price).replace(',', '.')) || 0) * qty
    })
    return acc
  }, 0)

  const getRowMinMax = (part) => {
    const vals = shops.map(shop => {
      const cell = prices[`${part.id}_${shop.id}`]
      return cell?.price ? parseFloat(String(cell.price).replace(',', '.')) : null
    }).filter(v => v !== null && !isNaN(v) && v > 0)
    if (vals.length < 2) return { min: null, max: null, pct: null }
    const mn = Math.min(...vals); const mx = Math.max(...vals)
    const pct = mn > 0 ? Math.round(((mx - mn) / mn) * 100) : null
    return { min: mn, max: mx, pct }
  }

  const totalParts = parts.length
  const totalShops = shops.length
  const grandTotal = totals.reduce((acc, t) => acc + t.total, 0)

  return (
    <div className="rounded-lg overflow-hidden border border-blue-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border-b border-gray-200">
        <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filtrar peças por nome ou código..."
          className="flex-1 text-xs bg-transparent border-0 outline-none placeholder-gray-400 text-gray-700"
          style={{ fontSize: '11px' }}
        />
        {filter && (
          <button onClick={() => setFilter('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
        {filter && (
          <span className="text-xs text-blue-500 shrink-0">{filteredParts.length}/{totalParts}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full" style={{ minWidth: '400px', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', height: '28px' }}>
              <th className="text-white/50 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '24px' }}>#</th>
              {showCodeColumn && <th className="text-white/60 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '52px', fontSize: '10px' }}>CÓD</th>}
              <th className="text-white font-semibold px-2 text-left border-r border-blue-700/40" style={{ width: '160px' }}>PEÇA</th>
              {showQuantityColumn && <th className="text-white/60 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '36px', fontSize: '10px' }}>QTD</th>}
              {shops.map((shop, si) => (
                <th key={shop.id} className="px-1 py-0 border-r border-blue-700/40" style={{ width: '96px' }}>
                  <div className="flex items-center gap-0.5 justify-between group h-7">
                    {editingShop === shop.id ? (
                      <input
                        autoFocus
                        className="border border-blue-300 rounded px-1 py-0 text-xs w-full bg-blue-50 text-blue-900 h-5"
                        value={shop.name}
                        onChange={e => onUpdateShopName(shop.id, e.target.value.toUpperCase())}
                        onBlur={() => setEditingShop(null)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && setEditingShop(null)}
                      />
                    ) : (
                      <span
                        className={`cursor-pointer truncate text-white text-xs font-medium hover:text-amber-300 flex-1 ${si === bestShopIdx && totals[si]?.total > 0 ? 'text-amber-300' : ''}`}
                        onClick={() => setEditingShop(shop.id)}
                        title="Clique para editar"
                      >
                        {si === bestShopIdx && totals[si]?.total > 0 ? '⭐ ' : ''}{shop.name}
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveShop(shop.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-400 text-xs w-3 h-3 flex items-center justify-center"
                    >×</button>
                  </div>
                </th>
              ))}
              <th className="px-1 py-0 border-r border-blue-700/40" style={{ width: '46px' }}>
                <button onClick={onAddShop} className="text-blue-200 hover:text-white text-xs font-bold whitespace-nowrap">+ Loja</button>
              </th>
              <th className="text-white/70 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '60px', fontSize: '10px' }}>MIN</th>
              <th className="text-white/70 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '60px', fontSize: '10px' }}>MAX</th>
              {showEconomyPercent && <th className="text-white/70 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '34px', fontSize: '10px' }}>ECON%</th>}
              <th className="text-white/70 font-normal px-1 text-left" style={{ minWidth: '60px', fontSize: '10px' }}>OBS</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const { min, max, pct } = getRowMinMax(part)
              return (
                <tr
                  key={part.id}
                  className="border-b border-gray-100 group/row hover:bg-blue-50/30"
                  style={{ height: '22px' }}
                >
                  <td className="px-1 text-center text-gray-400 font-mono border-r border-gray-100" style={{ width: '24px', fontSize: '11px' }}>
                    <span className="group-hover/row:hidden">{parts.indexOf(part) + 1}</span>
                    <button
                      onClick={() => onRemovePart(part.id)}
                      className="hidden group-hover/row:flex w-4 h-4 items-center justify-center text-red-400 hover:text-red-600 rounded mx-auto text-xs"
                    >×</button>
                  </td>
{showCodeColumn &&                   <td className="px-0 py-0 border-r border-gray-100" style={{ width: '52px' }}>
                    <EditableCell
                      value={part.code || ''}
                      onChange={v => onUpdatePart(part.id, 'code', v)}
                      className="text-gray-500 font-mono"
                      placeholder="REF"
                    />
                  </td>}
                  <td className="px-0 py-0 border-r border-gray-100" style={{ width: '160px' }}>
                    <EditableCell
                      value={part.name}
                      onChange={v => onUpdatePart(part.id, 'name', v)}
                      className="font-medium text-gray-800"
                      placeholder="NOME DA PEÇA"
                    />
                  </td>
{showQuantityColumn &&                   <td className="px-0 py-0 border-r border-gray-100" style={{ width: '36px' }}>
                    <EditableCell
                      value={part.quantity || ''}
                      onChange={v => onUpdatePart(part.id, 'quantity', v)}
                      className="text-center text-gray-700"
                      placeholder="1"
                    />
                  </td>}
                  {shops.map((shop, si) => {
                    const key = `${part.id}_${shop.id}`
                    const cell = prices[key] || {}
                    const isPurch = cell.isPurchased
                    const cellVal = cell.price ? parseFloat(String(cell.price).replace(',', '.')) : null
                    const isMin = min !== null && cellVal === min
                    const isMax = max !== null && cellVal === max
                    return (
                      <td
                        key={shop.id}
                        className={`px-0 py-0 border-r border-gray-100 relative group/cell ${
                          isPurch ? 'bg-green-50' : isMin ? 'bg-emerald-50' : isMax ? 'bg-red-50' : ''
                        }`}
                        style={{ width: '96px' }}
                      >
                        <div className="flex items-center">
                          <div className="flex-1">
                            <EditableCell
                              ref={(instance) => {
                                if (instance) priceCellRefs.current[key] = instance
                                else delete priceCellRefs.current[key]
                              }}
                              cellId={key}
                              value={cell.price || ''}
                              onChange={v => onUpdatePrice(part.id, shop.id, v)}
                              className={isPurch ? 'text-green-700 font-semibold' : isMin ? 'text-emerald-700' : isMax ? 'text-red-600' : 'text-blue-900'}
                              isMoney
                              placeholder="R$"
                              onEnter={() => focusCell(part.id, si, 'enter')}
                              onTab={(shift) => focusCell(part.id, si, shift ? 'shift-tab' : 'tab')}
                            />
                          </div>
                          {cell.price && (
                            <button
                              onClick={() => onCellClick(part.id, shop.id)}
                              className={`opacity-0 group-hover/cell:opacity-100 absolute right-0 top-0 bottom-0 w-4 flex items-center justify-center text-xs transition-all ${
                                isPurch ? 'bg-green-200 text-green-700 opacity-100' : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'
                              }`}
                              title={isPurch ? 'Comprado' : 'Marcar comprado'}
                            >{isPurch ? '✓' : '$'}</button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                  <td className="px-0 py-0 border-r border-gray-100" style={{ width: '46px' }} />
                  <td className="px-1 text-center border-r border-gray-100" style={{ width: '60px', fontSize: '11px' }}>
                    {min !== null ? <span className="text-emerald-600 font-semibold">{fmtMoney(min, currency)}</span> : ''}
                  </td>
                  <td className="px-1 text-center border-r border-gray-100" style={{ width: '60px', fontSize: '11px' }}>
                    {max !== null ? <span className="text-red-500">{fmtMoney(max, currency)}</span> : ''}
                  </td>
                  {showEconomyPercent && <td className="px-1 text-center border-r border-gray-100" style={{ width: '34px', fontSize: '10px' }}>
                    {pct !== null ? <span className="text-orange-500 font-medium">+{pct}%</span> : ''}
                  </td>}
                  <td className="px-0 py-0" style={{ minWidth: '60px' }}>
                    <EditableCell
                      value={part.obs || ''}
                      onChange={v => onUpdatePart(part.id, 'obs', v)}
                      className="text-gray-500 text-xs"
                      placeholder="OBS..."
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ height: '24px', background: '#f0f4ff' }}>
              <td colSpan={2 + (showCodeColumn ? 1 : 0) + (showQuantityColumn ? 1 : 0)} className="border-r border-gray-200">
                <button
                  onClick={onAddPart}
                  className="w-full text-left px-2 py-0 text-blue-500 hover:text-blue-700 font-medium text-xs"
                >+ Adicionar peça</button>
              </td>
              {shops.map((shop, si) => (
                <td key={shop.id} className={`px-1 text-center border-r border-gray-200 font-semibold text-xs ${si === bestShopIdx && totals[si]?.total > 0 ? 'text-amber-600' : 'text-blue-800'}`}>
                  {(showZeroValues || totals[si]?.total > 0) ? fmtMoney(totals[si].total, currency) : ''}
                </td>
              ))}
              <td className="border-r border-gray-200" />
              <td colSpan={3 + (showEconomyPercent ? 1 : 0)} className="px-2 text-xs text-gray-500">
                {purchasedTotal > 0 && <span className="text-green-600 font-medium">Comprado: {fmtMoney(purchasedTotal, currency)}</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-4 px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <span><span className="font-medium text-gray-700">{totalParts}</span> peças</span>
        <span><span className="font-medium text-gray-700">{totalShops}</span> lojas</span>
        {(showZeroValues || grandTotal > 0) && (
          <span>Total geral: <span className="font-semibold text-blue-700">{fmtMoney(grandTotal, currency)}</span></span>
        )}
        {purchasedTotal > 0 && (
          <span>Comprado: <span className="font-semibold text-green-600">{fmtMoney(purchasedTotal, currency)}</span></span>
        )}
        {filter && (
          <span className="ml-auto text-blue-500">Exibindo {filteredParts.length} de {totalParts} peças</span>
        )}
      </div>
    </div>
  )
}
