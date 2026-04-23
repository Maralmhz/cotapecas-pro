import { useState, useRef, useCallback } from 'react'
import EditableCell from './EditableCell'

const fmtBRL = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  if (isNaN(n) || !v) return ''
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SpreadsheetTable({
  quotation, onAddPart, onRemovePart, onUpdatePart,
  onAddShop, onRemoveShop, onUpdateShopName, onUpdatePrice, onCellClick
}) {
  const { parts, shops, prices } = quotation
  const [editingShop, setEditingShop] = useState(null)
  const tableRef = useRef()

  const focusCell = useCallback((partIdx, shopIdx, direction) => {
    if (direction === 'enter') {
      const nextPartIdx = partIdx + 1
      if (nextPartIdx < parts.length) {
        const el = tableRef.current?.querySelector(`[data-cell="${parts[nextPartIdx].id}_${shops[shopIdx]?.id}"]`)
        el?.click()
      }
    } else if (direction === 'tab') {
      const nextShopIdx = shopIdx + 1
      if (nextShopIdx < shops.length) {
        const el = tableRef.current?.querySelector(`[data-cell="${parts[partIdx].id}_${shops[nextShopIdx].id}"]`)
        el?.click()
      } else if (partIdx + 1 < parts.length) {
        const el = tableRef.current?.querySelector(`[data-cell="${parts[partIdx + 1].id}_${shops[0]?.id}"]`)
        el?.click()
      }
    } else if (direction === 'shift-tab') {
      const prevShopIdx = shopIdx - 1
      if (prevShopIdx >= 0) {
        const el = tableRef.current?.querySelector(`[data-cell="${parts[partIdx].id}_${shops[prevShopIdx].id}"]`)
        el?.click()
      }
    }
  }, [parts, shops])

  const totals = shops.map(shop => {
    let total = 0, count = 0
    parts.forEach(part => {
      const cell = prices[`${part.id}_${shop.id}`]
      if (cell?.price) { total += parseFloat(String(cell.price).replace(',', '.')) || 0; count++ }
    })
    return { shopId: shop.id, total, count }
  })

  const bestShopIdx = totals.length > 0
    ? totals.reduce((bi, t, i) => t.total > 0 && (totals[bi].total === 0 || t.total < totals[bi].total) ? i : bi, 0)
    : -1

  const purchasedTotal = parts.reduce((acc, part) => {
    shops.forEach(shop => {
      const cell = prices[`${part.id}_${shop.id}`]
      if (cell?.isPurchased && cell?.price) acc += parseFloat(String(cell.price).replace(',', '.')) || 0
    })
    return acc
  }, 0)

  // Per-row min/max price
  const getRowMinMax = (part) => {
    const vals = shops.map(shop => {
      const cell = prices[`${part.id}_${shop.id}`]
      return cell?.price ? parseFloat(String(cell.price).replace(',', '.')) : null
    }).filter(v => v !== null && !isNaN(v) && v > 0)
    if (vals.length < 2) return { min: null, max: null }
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }

  return (
    <div className="rounded-lg overflow-x-auto border border-blue-200 bg-white shadow-sm" ref={tableRef}>
      <table className="border-collapse w-full" style={{ minWidth: '400px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', height: '28px' }}>
            <th className="text-white/50 font-normal px-1 text-center border-r border-blue-700/40" style={{ width: '28px' }}>#</th>
            <th className="text-white font-semibold px-2 text-left border-r border-blue-700/40" style={{ minWidth: '140px' }}>PEÇA</th>
            {shops.map((shop, si) => (
              <th key={shop.id} className="px-1 py-0 border-r border-blue-700/40" style={{ minWidth: '88px', maxWidth: '110px' }}>
                <div className="flex items-center gap-0.5 justify-between group h-7">
                  {editingShop === shop.id ? (
                    <input
                      autoFocus
                      className="border border-blue-300 rounded px-1 py-0 text-xs w-full bg-blue-50 text-blue-900 h-5"
                      value={shop.name}
                      onChange={e => onUpdateShopName(shop.id, e.target.value)}
                      onBlur={() => setEditingShop(null)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && setEditingShop(null)}
                    />
                  ) : (
                    <span
                      className={`cursor-pointer truncate text-white text-xs font-medium hover:text-amber-300 flex-1 ${si === bestShopIdx && totals[si]?.total > 0 ? 'text-amber-300' : ''}`}
                      onClick={() => setEditingShop(shop.id)}
                      title="Clique para editar"
                    >
                      {si === bestShopIdx && totals[si]?.total > 0 ? '⭐' : ''}{shop.name}
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveShop(shop.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-400 text-xs w-3 h-3 flex items-center justify-center"
                  >×</button>
                </div>
              </th>
            ))}
            <th className="px-1 py-0 border-r border-blue-700/40" style={{ width: '50px' }}>
              <button
                onClick={onAddShop}
                className="text-blue-200 hover:text-white text-xs font-bold whitespace-nowrap"
              >+ Loja</button>
            </th>
            <th className="text-white/70 font-normal px-1 text-center" style={{ width: '40px' }}>MIN</th>
            <th className="text-white/70 font-normal px-1 text-center" style={{ width: '40px' }}>MAX</th>
            <th className="text-white/70 font-normal px-1 text-left" style={{ minWidth: '60px' }}>OBS</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, pi) => {
            const { min, max } = getRowMinMax(part)
            return (
              <tr
                key={part.id}
                className="border-b border-gray-100 group/row hover:bg-blue-50/30"
                style={{ height: '22px' }}
              >
                <td className="px-1 text-center text-gray-400 font-mono border-r border-gray-100" style={{ width: '28px', fontSize: '11px' }}>
                  <span className="group-hover/row:hidden">{pi + 1}</span>
                  <button
                    onClick={() => onRemovePart(part.id)}
                    className="hidden group-hover/row:flex w-4 h-4 items-center justify-center text-red-400 hover:text-red-600 rounded mx-auto text-xs"
                  >×</button>
                </td>
                <td className="px-0 py-0 border-r border-gray-100" style={{ minWidth: '140px' }}>
                  <EditableCell
                    value={part.name}
                    onChange={v => onUpdatePart(part.id, 'name', v)}
                    className="font-medium text-gray-800"
                    placeholder="Nome da peça"
                  />
                </td>
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
                      data-cell={key}
                      style={{ minWidth: '88px' }}
                    >
                      <div className="flex items-center">
                        <div className="flex-1" data-cell={key}>
                          <EditableCell
                            value={cell.price || ''}
                            onChange={v => onUpdatePrice(part.id, shop.id, v)}
                            className={isPurch ? 'text-green-700 font-semibold' : isMin ? 'text-emerald-700' : isMax ? 'text-red-600' : 'text-blue-900'}
                            isMoney
                            placeholder="R$"
                            onEnter={() => focusCell(pi, si, 'enter')}
                            onTab={(shift) => focusCell(pi, si, shift ? 'shift-tab' : 'tab')}
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
                <td className="px-0 py-0 border-r border-gray-100" style={{ width: '50px' }} />
                <td className="px-1 text-center border-r border-gray-100" style={{ width: '40px', fontSize: '11px' }}>
                  {min !== null ? <span className="text-emerald-600 font-semibold">{fmtBRL(min)}</span> : ''}
                </td>
                <td className="px-1 text-center border-r border-gray-100" style={{ width: '40px', fontSize: '11px' }}>
                  {max !== null ? <span className="text-red-500">{fmtBRL(max)}</span> : ''}
                </td>
                <td className="px-0 py-0" style={{ minWidth: '60px' }}>
                  <EditableCell
                    value={part.obs || ''}
                    onChange={v => onUpdatePart(part.id, 'obs', v)}
                    className="text-gray-400 italic"
                    placeholder="obs"
                  />
                </td>
              </tr>
            )
          })}
          {/* Add part row */}
          <tr className="border-t border-gray-100">
            <td colSpan={4 + shops.length + 2} className="px-2 py-1">
              <button
                onClick={onAddPart}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-0.5 rounded"
              >
                + Adicionar Peca
              </button>
            </td>
          </tr>
          {/* Totals row */}
          {shops.length > 0 && (
            <tr className="border-t-2 border-blue-200" style={{ background: '#f0f5ff', height: '24px' }}>
              <td className="px-1 border-r border-gray-200" />
              <td className="px-2 text-xs font-bold text-blue-900 border-r border-gray-200">TOTAL</td>
              {totals.map((t, i) => (
                <td key={t.shopId} className={`px-1 text-right border-r border-gray-200 text-xs ${
                  i === bestShopIdx && t.total > 0 ? 'text-green-700 font-bold' : 'text-blue-800 font-semibold'
                }`}>
                  <div>{fmtBRL(t.total) || '—'}</div>
                  <div className="text-gray-400 font-normal" style={{ fontSize: '10px' }}>{t.count}p</div>
                </td>
              ))}
              <td className="border-r border-gray-200" />
              <td colSpan={3} className="px-2">
                {purchasedTotal > 0 && (
                  <span className="text-green-700 font-bold text-xs">Comprado: {fmtBRL(purchasedTotal)}</span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
