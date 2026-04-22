import { useRef, useState } from 'react'

export default function QuotationHeader({ quotation, onChange }) {
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)

  const loadImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange('vehiclePhoto', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handlePhoto = (e) => loadImage(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadImage(file)
    else {
      // Try URL from drag
      const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list')
      if (url) onChange('vehiclePhoto', url)
    }
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        loadImage(item.getAsFile())
        e.preventDefault()
        return
      }
    }
  }

  return (
    <div
      className="glass rounded-xl mb-4 p-4 flex gap-4 items-start"
      onPaste={handlePaste}
    >
      {/* Photo area - drag, paste, click, or file */}
      <div
        className={`relative flex-shrink-0 w-28 h-20 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
          dragging
            ? 'border-blue-500 bg-blue-100 scale-105'
            : quotation.vehiclePhoto
              ? 'border-transparent'
              : 'border-blue-300 hover:border-blue-500 bg-blue-50/60 hover:bg-blue-50'
        }`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        title="Clique, cole (Ctrl+V) ou arraste uma foto"
      >
        {quotation.vehiclePhoto ? (
          <>
            <img src={quotation.vehiclePhoto} alt="veiculo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Trocar foto</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span className="text-blue-400 text-xs text-center leading-tight">
              {dragging ? 'Solte aqui!' : 'Foto'}
            </span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      {/* Fields */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Oficina | Titulo */}
        <div className="flex gap-2 items-center">
          <div className="flex flex-col gap-1" style={{ minWidth: '160px', maxWidth: '220px' }}>
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Oficina</label>
            <input
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Nome da oficina"
              value={quotation.oficina}
              onChange={e => onChange('oficina', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Veiculo / Placa / Proprietario</label>
            <input
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              placeholder="HB20 2023 PRATA SIL7D35 JOAO SILVA 9BHCN51AARP486939"
              value={quotation.title === 'Nova Cotacao' ? '' : quotation.title}
              onChange={e => onChange('title', e.target.value)}
            />
          </div>
        </div>

        {/* Display badge */}
        {(quotation.oficina || (quotation.title && quotation.title !== 'Nova Cotacao')) && (
          <div className="flex items-center gap-2 flex-wrap">
            {quotation.oficina && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                {quotation.oficina}
              </span>
            )}
            {quotation.title && quotation.title !== 'Nova Cotacao' && (
              <span className="text-xs text-gray-500 font-medium truncate max-w-xs">{quotation.title}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
