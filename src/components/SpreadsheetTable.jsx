import { useState } from 'react'
import EditableCell from './EditableCell'

const fmtBRL = (v) => {
  const n = parseFloat(v)
  if (isNaN(n)) return ''
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SpreadsheetTable({
  quotation, onAddPart, onRemovePart, onUpdatePart,
  onAddShop, onRemoveShop, onUpdateShopName, onUpdatePrice, onCellClick
}) {
  const { parts, shops, prices } = quotation
  const [editingShop, setEditingShop] = useState(null)

  const totals = shops.map(shop => {
    let total = 0
    let count = 0
    parts.forEach(part => {
      const key = `${part.id}_${shop.id}`
      const cell = prices[key]
      if (cell && cell.price) {
        total += parseFloat(cell.price) || 0
        count++
      }
    })
    return { shopId: shop.id, total, count }
  })

  const purchasedTotal = parts.reduce((acc, part) => {
    shops.forEach(shop => {
      const key = `${part.id}_${shop.id}`
      const cell = prices[key]
      if (cell && cell.isPurchased && cell.price) acc += parseFloat(cell.price) || 0
    })
    return acc
  }, 0)

  return (
    <div className="bg-white border border-gray-300 rounded mb-3 overflow-x-auto">
      <table className="border-collapse text-sm" style={{ minWidth: '100%' }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-center w-8 text-gray-500">#</th>
            <th className="border border-gray-300 px-2 py-1 text-left min-w-[180px]">PECA</th>
            {shops.map(shop => (
              <th key={shop.id} className="border border-gray-300 px-1 py-1 min-w-[110px]">
                <div className="flex items-center gap-1 justify-between">
                  {editingShop === shop.id ? (
                    <input
                      autoFocus
                      className="border border-blue-400 rounded px-1 py-0 text-xs w-full"
                      value={shop.name}
                      onChange={e => onUpdateShopName(shop.id, e.target.value)}
                      onBlur={() => setEditingShop(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingShop(null)}
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-blue-600 truncate"
                      onClick={() => setEditingShop(shop.id)}
                    >{shop.name}</span>
                  )}
                  <button
                    onClick={() => onRemoveShop(shop.id)}
                    className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
                    title="Remover loja"
                  >x</button>
                </div>
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-1 w-16">
              <button
                onClick={onAddShop}
                className="w-full text-blue-600 hover:text-blue-800 font-bold"
                title="Adicionar loja"
              >+ Loja</button>
            </th>
            <th className="border border-gray-300 px-2 py-1 min-w-[100px] text-left">OBS</th>
            <th className="border border-gray-300 px-2 py-1 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, idx) => (
            <tr key={part.id} className="hover:bg-blue-50">
              <td className="border border-gray-300 px-2 py-1 text-center text-gray-400 text-xs">{idx + 1}</td>
              <td className="border border-gray-300 px-1 py-0">
                <EditableCell
                  value={part.name}
                  onChange={v => onUpdatePart(part.id, 'name', v)}
                  className="font-medium"
                />
              </td>
              {shops.map(shop => {
                const key = `${part.id}_${shop.id}`
                const cell = prices[key] || {}
                return (
                  <td
                    key={shop.id}
                    className={`border border-gray-300 px-1 py-0 cursor-pointer ${
                      cell.isPurchased ? 'bg-green-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <EditableCell
                        value={cell.price || ''}
                        onChange={v => onUpdatePrice(part.id, shop.id, v)}
                        className={`text-right ${cell.isPurchased ? 'text-green-700 font-semibold' : ''}`}
                        isMoney
                      />
                      {cell.price && (
                        <button
                          onClick={() => onCellClick(part.id, shop.id)}
                          className={`text-xs flex-shrink-0 ${
                            cell.isPurchased ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'
                          }`}
                          title={cell.isPurchased ? 'Comprado - clique para editar' : 'Marcar como comprado'}
                        >
                          {cell.isPurchased ? 'ok' : 'buy'}
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
              <td className="border border-gray-300 px-1 py-0"></td>
              <td className="border border-gray-300 px-1 py-0">
                <EditableCell
                  value={part.obs || ''}
                  onChange={v => onUpdatePart(part.id, 'obs', v)}
                  className="text-gray-500 text-xs"
                />
              </td>
              <td className="border border-gray-300 px-1 py-1 text-center">
                <button
                  onClick={() => onRemovePart(part.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                  title="Remover peca"
                >x</button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={3 + shops.length} className="border border-gray-300 px-2 py-1">
              <button
                onClick={onAddPart}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >+ Adicionar Peca</button>
            </td>
          </tr>
          {shops.length > 0 && (
            <tr className="bg-gray-50 font-medium">
              <td className="border border-gray-300 px-2 py-1" colSpan={2}>TOTAL</td>
              {totals.map(t => (
                <td key={t.shopId} className="border border-gray-300 px-2 py-1 text-right text-xs">
                  {fmtBRL(t.total)}<br/>
                  <span className="text-gray-400">{t.count} itens</span>
                </td>
              ))}
              <td className="border border-gray-300" colSpan={3}></td>
            </tr>
          )}
        </tbody>
      </table>
      {purchasedTotal > 0 && (
        <div className="p-2 bg-green-50 border-t border-gray-300 text-sm">
          <span className="text-green-700 font-semibold">Comprado: {fmtBRL(purchasedTotal)}</span>
        </div>
      )}
    </div>
  )
}
