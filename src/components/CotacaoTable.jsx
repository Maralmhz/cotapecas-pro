import { useState, useRef, useCallback, useEffect } from 'react'
import useEventStore from '../store/useEventStore'
import { useKeyboardNav } from '../hooks/useKeyboardNav'
import { formatarBRL, getPrecoPecas } from '../lib/calculations'

const STATUS_COLORS = {
  comprado: 'bg-green-100 border-green-300',
  boleto: 'bg-yellow-100 border-yellow-300',
  cartao: 'bg-blue-100 border-blue-300',
  cancelado: 'bg-red-100 border-red-300',
  pending: 'bg-white border-gray-200',
}

const PAYMENT_LABELS = {
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  cartao: 'Cartao',
  pix: 'Pix',
}

export default function CotacaoTable({ evento }) {
  const lojas = useEventStore(s => s.lojas)
  const atualizarPreco = useEventStore(s => s.atualizarPreco)
  const selecionarLoja = useEventStore(s => s.selecionarLoja)
  const adicionarPeca = useEventStore(s => s.adicionarPeca)
  const deletarPeca = useEventStore(s => s.deletarPeca)

  const [focusCell, setFocusCell] = useState({ row: -1, col: -1 })
  const [editingCell, setEditingCell] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [novaPeca, setNovaPeca] = useState('')
  const [showPayMenu, setShowPayMenu] = useState(null)
  const cellRefs = useRef({})

  const parts = evento?.parts || []
  const totalCols = lojas.length

  const focusCell_ = useCallback((row, col) => {
    setFocusCell({ row, col })
    const key = `${row}-${col}`
    if (cellRefs.current[key]) {
      cellRefs.current[key].focus()
    }
  }, [])

  const { handleKeyDown } = useKeyboardNav(parts.length, totalCols, focusCell_)

  const startEdit = (rowIdx, colIdx, peca, loja) => {
    const val = peca.prices[loja.id] || ''
    setEditingCell({ rowIdx, colIdx, pecaId: peca.id, lojaId: loja.id })
    setEditVal(val)
  }

  const commitEdit = async () => {
    if (!editingCell) return
    const { pecaId, lojaId } = editingCell
    await atualizarPreco(pecaId, lojaId, editVal)
    setEditingCell(null)
  }

  const handleCellKeyDown = (e, rowIdx, colIdx, peca, loja) => {
    if (e.key === 'F2' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey)) {
      startEdit(rowIdx, colIdx, peca, loja)
      return
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.key)) {
      handleKeyDown(e, rowIdx, colIdx)
    }
  }

  const handleEditKeyDown = async (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      await commitEdit()
      const { rowIdx, colIdx } = editingCell
      const nr = e.key === 'Enter' ? Math.min(parts.length - 1, rowIdx + 1) : rowIdx
      const nc = e.key === 'Tab' ? Math.min(totalCols - 1, colIdx + 1) : colIdx
      focusCell_(nr, nc)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const handleAddPeca = async (e) => {
    if (e.key === 'Enter' && novaPeca.trim()) {
      await adicionarPeca(evento.id, novaPeca.trim())
      setNovaPeca('')
    }
  }

  const handleSelectLoja = async (peca, lojaId, pagamento) => {
    const novoPagamento = pagamento || 'dinheiro'
    await selecionarLoja(peca.id, lojaId, novoPagamento)
    setShowPayMenu(null)
  }

  const getRowClass = (peca) => {
    if (!peca.selectedStore) return STATUS_COLORS.pending
    const pay = peca.paymentType
    if (pay === 'boleto') return STATUS_COLORS.boleto
    if (pay === 'cartao') return STATUS_COLORS.cartao
    if (peca.status === 'cancelado') return STATUS_COLORS.cancelado
    return STATUS_COLORS.comprado
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="text-left px-4 py-3 font-semibold min-w-[200px] sticky left-0 bg-gray-800 z-10">#</th>
            <th className="text-left px-4 py-3 font-semibold min-w-[220px] sticky left-8 bg-gray-800 z-10">Peca</th>
            {lojas.map(loja => (
              <th key={loja.id} className="text-center px-4 py-3 font-semibold min-w-[130px]">{loja.nome}</th>
            ))}
            <th className="text-center px-4 py-3 font-semibold min-w-[140px]">Comprar Em</th>
            <th className="text-center px-4 py-3 font-semibold min-w-[120px]">Forma Pag.</th>
            <th className="text-center px-4 py-3 font-semibold min-w-[110px]">Melhor</th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {parts.map((peca, rowIdx) => {
            const { melhor, pior, melhorIdx } = getPrecoPecas(lojas.map(l => peca.prices[l.id]))
            return (
              <tr key={peca.id} className={`border-b ${getRowClass(peca)} hover:brightness-95 transition-all`}>
                <td className="px-3 py-2 text-gray-400 text-xs sticky left-0 bg-inherit">{rowIdx + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800 sticky left-8 bg-inherit">{peca.name}</td>
                {lojas.map((loja, colIdx) => {
                  const isEditing = editingCell?.pecaId === peca.id && editingCell?.lojaId === loja.id
                  const isFocused = focusCell.row === rowIdx && focusCell.col === colIdx
                  const isMelhor = melhorIdx === colIdx
                  const isSelected = peca.selectedStore === loja.id
                  return (
                    <td
                      key={loja.id}
                      className={`px-2 py-1.5 text-center border-l border-gray-100 ${
                        isSelected ? 'ring-2 ring-inset ring-green-400' : ''
                      } ${isMelhor && !isEditing ? 'text-green-700 font-semibold' : ''}`}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          className="w-full text-center border-2 border-blue-500 rounded px-1 py-0.5 bg-blue-50 outline-none text-sm"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleEditKeyDown}
                        />
                      ) : (
                        <div
                          ref={el => cellRefs.current[`${rowIdx}-${colIdx}`] = el}
                          tabIndex={0}
                          className={`w-full min-h-[28px] flex items-center justify-center rounded cursor-text ${
                            isFocused ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:bg-gray-100'
                          }`}
                          onFocus={() => setFocusCell({ row: rowIdx, col: colIdx })}
                          onClick={() => startEdit(rowIdx, colIdx, peca, loja)}
                          onKeyDown={e => handleCellKeyDown(e, rowIdx, colIdx, peca, loja)}
                        >
                          {peca.prices[loja.id] ? formatarBRL(parseFloat(peca.prices[loja.id])) : (
                            <span className="text-gray-300 text-xs">--</span>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
                {/* Selecao de loja */}
                <td className="px-2 py-1.5 text-center border-l border-gray-100 relative">
                  <button
                    className={`w-full px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      peca.selectedStore
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setShowPayMenu(showPayMenu === peca.id ? null : peca.id)}
                  >
                    {peca.selectedStore
                      ? lojas.find(l => l.id === peca.selectedStore)?.nome || 'Selecionada'
                      : 'Selecionar'
                    }
                  </button>
                  {showPayMenu === peca.id && (
                    <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-[200px]">
                      {lojas.map(loja => (
                        <div key={loja.id} className="p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">{loja.nome}</p>
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() => handleSelectLoja(peca, loja.id, k)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-800 rounded-md transition"
                              >{v}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button onClick={() => handleSelectLoja(peca, null, null)} className="w-full text-xs text-red-500 hover:bg-red-50 py-1 rounded mt-1">Cancelar selecao</button>
                    </div>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center border-l border-gray-100">
                  {peca.paymentType && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {PAYMENT_LABELS[peca.paymentType] || peca.paymentType}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center border-l border-gray-100">
                  {melhor !== null && (
                    <span className="text-xs font-semibold text-green-700">{formatarBRL(melhor)}</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => deletarPeca(peca.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                    title="Remover peca"
                  >&times;</button>
                </td>
              </tr>
            )
          })}
          {/* Linha adicionar peca */}
          <tr className="bg-gray-50 border-t-2 border-dashed border-gray-200">
            <td className="px-3 py-2 text-gray-400 text-xs sticky left-0 bg-gray-50">{parts.length + 1}</td>
            <td className="px-3 py-2 sticky left-8 bg-gray-50" colSpan={lojas.length + 4}>
              <input
                className="w-full bg-transparent border-none outline-none text-sm text-gray-500 placeholder-gray-400"
                placeholder="+ Adicionar peca (Enter para confirmar)"
                value={novaPeca}
                onChange={e => setNovaPeca(e.target.value)}
                onKeyDown={handleAddPeca}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {showPayMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowPayMenu(null)} />
      )}
    </div>
  )
}
