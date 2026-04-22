import { useState, useRef, useEffect } from 'react'

export default function EditableCell({ value, onChange, className = '', isMoney = false }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef()

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select()
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  const display = isMoney && value
    ? parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : value

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`w-full px-1 py-0.5 text-sm outline-none border border-blue-400 rounded ${className}`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Tab') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
      />
    )
  }

  return (
    <div
      className={`w-full px-1 py-0.5 text-sm cursor-text min-h-[24px] hover:bg-yellow-50 ${className}`}
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      {display || <span className="text-gray-300">...</span>}
    </div>
  )
}
