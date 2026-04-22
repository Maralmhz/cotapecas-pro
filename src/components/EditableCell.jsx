import { useState, useRef, useEffect } from 'react'

// Registry of cells for Enter/Tab navigation
const cellRegistry = {}
let cellOrder = []

export function registerCell(id, ref) { cellRegistry[id] = ref }
export function unregisterCell(id) { delete cellRegistry[id] }
export function setCellOrder(order) { cellOrder = order }

function focusNext(currentId, direction = 'down') {
  const idx = cellOrder.indexOf(currentId)
  if (idx === -1) return
  const nextIdx = direction === 'down' ? idx + cellOrder.length / 2 : idx + 1
  // Simple: just find next by index in order
  const keys = Object.keys(cellRegistry)
  const ci = keys.indexOf(currentId)
  if (ci === -1) return
  const target = direction === 'tab' ? keys[ci + 1] : null
  if (target && cellRegistry[target]) cellRegistry[target].focus()
}

export default function EditableCell({
  value, onChange, className = '', isMoney = false,
  cellId = null, onEnter = null, onTab = null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) onChange(trimmed)
  }

  const fmt = (v) => {
    if (!v) return ''
    const n = parseFloat(v)
    if (isNaN(n)) return v
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const display = isMoney ? fmt(value) : value

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`w-full px-1.5 py-0.5 text-xs outline-none border-2 border-blue-500 rounded bg-blue-50 ${isMoney ? 'text-right font-mono' : ''} ${className}`}
        style={isMoney ? { minWidth: '80px', maxWidth: '110px' } : {}}
        value={draft}
        placeholder={isMoney ? '0,00' : ''}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
            if (onEnter) onEnter()
          }
          if (e.key === 'Tab') {
            e.preventDefault()
            commit()
            if (onTab) onTab(e.shiftKey)
          }
        }}
      />
    )
  }

  return (
    <div
      className={`w-full px-1.5 py-0.5 text-xs cursor-text min-h-[26px] flex items-center hover:bg-blue-50/60 rounded transition-colors ${isMoney ? 'text-right font-mono justify-end' : ''} ${className}`}
      style={isMoney ? { minWidth: '80px', maxWidth: '110px' } : {}}
      onClick={() => { setDraft(value || ''); setEditing(true) }}
    >
      {display
        ? <span className={isMoney ? 'text-gray-800' : ''}>{display}</span>
        : <span className="text-gray-300 text-xs">{isMoney ? 'R$ —' : '...'}</span>
      }
    </div>
  )
}
