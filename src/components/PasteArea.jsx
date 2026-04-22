import { useState } from 'react'

export default function PasteArea({ onConvert }) {
  const [text, setText] = useState('')

  const handleConvert = () => {
    if (!text.trim()) return
    onConvert(text)
    setText('')
  }

  return (
    <div className="bg-white border border-gray-300 rounded mb-3 p-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Cole aqui a lista de pecas (uma por linha):</p>
      <textarea
        className="w-full border border-gray-300 rounded p-2 text-sm font-mono h-28 resize-none focus:outline-none focus:border-blue-400"
        placeholder="Filtro de oleo&#10;Filtro de ar&#10;Correia dentada&#10;Velas de ignicao"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleConvert}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >Converter em Planilha</button>
        <button
          onClick={() => setText('')}
          className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >Limpar</button>
      </div>
    </div>
  )
}
