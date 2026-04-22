import { useState, useRef, useCallback } from 'react'
import EditableCell from './EditableCell'

const fmtBRL = (v) => {
  const n = parseFloat(v)
  if (isNaN(n) || !v) return ''
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SpreadsheetTable({
  quotation, onAddPart, onRemovePart, onUpdatePart,
  onAddShop, onRemoveShop, onUpdateShopName, onUpdatePrice, onCellClick
}) {
  const { parts, shops, prices } = quotation
  const [editingShop, setEditingShop] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const tableRef = useRef()

  // Focus next cell: Enter = row below, Tab = column right
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
      if (cell?.price) { total += parseFloat(cell.price) || 0; count++ }
    })
    return { shopId: shop.id, total, count }
  })

  const purchasedTotal = parts.reduce((acc, part) => {
    shops.forEach(shop => {
      const cell = prices[`${part.id}_${shop.id}`]
      if (cell?.isPurchased && cell?.price) acc += parseFloat(cell.price) || 0
    })
    return acc
  }, 0)

  const bestShopIdx = totals.length > 0
    ? totals.reduce((bi, t, i) => t.total > 0 && (totals[bi].total === 0 || t.total < totals[bi].total) ? i : bi, 0)
    : -1

  return (
    <div className="glass rounded-xl mb-4 overflow-x-auto" ref={tableRef}>
      <table className="border-collapse w-full text-xs" style={{ minWidth: '500px' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #1e3a8a, #2151a1)' }}>
            <th className="text-white/60 font-medium px-2 py-2.5 w-8 text-center">#</th>
            <th className="text-white font-semibold px-3 py-2.5 text-left" style={{ minWidth: '160px' }}>PEÇA</th>
            {shops.map((shop, si) => (
              <th key={shop.id} className="px-1 py-2" style={{ minWidth: '100px', maxWidth: '120px' }}>
                <div className="flex items-center gap-1 justify-between group">
                  {editingShop === shop.id ? (
                    <input
                      autoFocus
                      className="border border-blue-300 rounded px-1 py-0 text-xs w-full bg-blue-50 text-blue-900"
                      value={shop.name}
                      onChange={e => onUpdateShopName(shop.id, e.target.value)}
                      onBlur={() => setEditingShop(null)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && setEditingShop(null)}
                    />
                  ) : (
                    <span
                      className={`cursor-pointer truncate text-white font-medium hover:text-amber-300 transition-colors flex-1 ${si === bestShopIdx && totals[si].total > 0 ? 'text-amber-300' : ''}`}
                      onClick={() => setEditingShop(shop.id)}
                      title="Clique para editar nome"
                    >
                      {si === bestShopIdx && totals[si].total > 0 ? '⭐ ' : ''}{shop.name}
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveShop(shop.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-400 transition-all text-xs w-4 h-4 flex items-center justify-center rounded"
                  >x</button>
                </div>
              </th>
            ))}
            <th className="px-2 py-2">
              <button
                onClick={onAddShop}
                className="text-blue-200 hover:text-white hover:bg-blue-600 px-2 py-1 rounded text-xs font-bold transition-all whitespace-nowrap"
              >+ Loja</button>
            </th>
            <th className="text-white/70 font-medium px-2 py-2.5 text-left" style={{ minWidth: '80px' }}>OBS</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, pi) => (
            <tr
              key={part.id}
              className="border-b border-blue-100/60 group/row"
              onMouseEnter={() => setHoveredRow(part.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-2 py-0.5 text-center text-gray-400 font-mono" style={{ width: '32px' }}>
                <span className="group-hover/row:hidden">{pi + 1}</span>
                <button
                  onClick={() => onRemovePart(part.id)}
                  className="hidden group-hover/row:flex w-5 h-5 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all mx-auto"
                  title="Remover"
                >x</button>
              </td>
              <td className="px-0 py-0">
                <EditableCell
                  value={part.name}
                  onChange={v => onUpdatePart(part.id, 'name', v)}
                  className="font-medium text-gray-800"
                />
              </td>
              {shops.map((shop, si) => {
                const key = `${part.id}_${shop.id}`
                const cell = prices[key] || {}
                const isPurch = cell.isPurchased
                return (
                  <td
                    key={shop.id}
                    className={`px-0 py-0 border-l border-blue-100/40 ${isPurch ? 'purchased-cell' : ''}`}
                    data-cell={key}
                  >
                    <div className="flex items-center relative group/cell">
                      <div
                        className={`flex-1 ${isPurch ? 'text-green-800 font-semibold' : ''}`}
                        data-cell={key}
                      >
                        <EditableCell
                          value={cell.price || ''}
                          onChange={v => onUpdatePrice(part.id, shop.id, v)}
                          className={isPurch ? 'text-green-800 font-semibold' : 'text-blue-900'}
                          isMoney
                          onEnter={() => focusCell(pi, si, 'enter')}
                          onTab={(shift) => focusCell(pi, si, shift ? 'shift-tab' : 'tab')}
                        />
                      </div>
                      {cell.price && (
                        <button
                          onClick={() => onCellClick(part.id, shop.id)}
                          className={`opacity-0 group-hover/cell:opacity-100 absolute right-0 top-0 bottom-0 w-5 flex items-center justify-center text-xs transition-all rounded ${
                            isPurch
                              ? 'bg-green-200 text-green-700 opacity-100'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                          title={isPurch ? 'Comprado' : 'Marcar como comprado'}
                        >
                          {isPurch ? '✓' : '$'}
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
              <td className="px-0 py-0 border-l border-blue-100/40"></td>
              <td className="px-0 py-0 border-l border-blue-100/40">
                <EditableCell
                  value={part.obs || ''}
                  onChange={v => onUpdatePart(part.id, 'obs', v)}
                  className="text-gray-500 italic"
                />
              </td>
            </tr>
          ))}
          {/* Add row */}
          <tr className="border-t border-blue-100">
            <td colSpan={3 + shops.length + 1} className="px-3 py-2">
              <button
                onClick={onAddPart}
                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-all"
              >
                <span className="text-base leading-none">+</span> Adicionar Peca
              </button>
            </td>
          </tr>
          {/* Totals row */}
          {shops.length > 0 && (
            <tr style={{ background: 'linear-gradient(135deg, #1e3a8a11, #2151a118)' }} className="border-t border-blue-200">
              <td className="px-2 py-2" />
              <td className="px-3 py-2 text-xs font-bold text-blue-900">TOTAL</td>
              {totals.map((t, i) => (
                <td key={t.shopId} className={`px-2 py-2 text-right border-l border-blue-100 ${i === bestShopIdx && t.total > 0 ? 'text-green-700 font-bold' : 'text-blue-800 font-semibold'}`}>
                  <div>{fmtBRL(t.total) || '—'}</div>
                  <div className="text-gray-400 font-normal">{t.count} itens</div>
                </td>
              ))}
              <td colSpan={2} className="px-3 py-2 border-l border-blue-100">
                {purchasedTotal > 0 && (
                  <span className="text-green-700 font-bold text-xs">
                    Comprado: {fmtBRL(purchasedTotal)}
                  </span>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
