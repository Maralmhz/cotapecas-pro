import { useState, useRef, useEffect, useCallback } from 'react'

export default function EditableCell({
  value,
  onChange,
  className = '',
  isMoney = false,
  onEnter = null,
  onTab = null,
  placeholder = '',
  cellId = null,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const inputRef = useRef()
  const divRef = useRef()

  useEffect(() => { setDraft(value ?? '') }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = useCallback((callback) => {
    const raw = isMoney
      ? String(draft).replace(/[^0-9,.]/g, '').replace(',', '.')
      : String(draft)
    const v = (!isMoney && raw) ? raw.toUpperCase() : raw
    if (v !== (value ?? '')) onChange(v)
    setEditing(false)
    if (callback) setTimeout(callback, 30)
  }, [draft, value, onChange, isMoney])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      commit(onEnter)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      commit(onTab ? () => onTab(e.shiftKey) : null)
    } else if (e.key === 'Escape') {
      setDraft(value ?? '')
      setEditing(false)
      setTimeout(() => divRef.current?.focus(), 30)
    }
  }

  const handleDivKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      setDraft(value ?? '')
      setEditing(true)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (onTab) onTab(e.shiftKey)
    }
  }

  const displayValue = () => {
    if (!value && value !== 0) return ''
    if (isMoney) {
      const n = parseFloat(String(value).replace(',', '.'))
      if (isNaN(n)) return ''
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return value
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(isMoney ? e.target.value : e.target.value.toUpperCase())}
        onBlur={() => commit(null)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full h-full px-1 py-0 text-xs border-0 outline-none bg-yellow-50 border-b-2 border-blue-500 ${className}`}
        style={{ minHeight: '22px', lineHeight: '22px', display: 'block' }}
      />
    )
  }

  return (
    <div
      ref={divRef}
      tabIndex={0}
      data-cell={cellId}
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      onKeyDown={handleDivKeyDown}
      className={`w-full h-full px-1 py-0 text-xs cursor-pointer hover:bg-blue-50/60 truncate select-none focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400 focus:ring-inset ${className}`}
      style={{ minHeight: '22px', lineHeight: '22px' }}
      title={displayValue() || placeholder}
    >
      {displayValue() || <span className="text-gray-300 text-xs">{placeholder}</span>}
    </div>
  )
}
