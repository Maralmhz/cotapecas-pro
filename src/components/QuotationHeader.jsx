import { useRef } from 'react'

export default function QuotationHeader({ quotation, onChange }) {
  const fileRef = useRef()

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange('vehiclePhoto', ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white border border-gray-300 rounded mb-3 p-3 flex gap-4 items-start">
      <div
        className="w-28 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:border-blue-400"
        onClick={() => fileRef.current.click()}
      >
        {quotation.vehiclePhoto
          ? <img src={quotation.vehiclePhoto} alt="veiculo" className="w-full h-full object-cover" />
          : <span className="text-gray-400 text-xs text-center">Foto<br/>Veiculo</span>
        }
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <input
          className="border border-gray-300 rounded px-2 py-1 text-sm font-medium w-full focus:outline-none focus:border-blue-400"
          placeholder="Titulo do veiculo (ex: HB20 2023 PRATA SIL7D35 JOAO SILVA 9BHCN51AARP486939)"
          value={quotation.title}
          onChange={e => onChange('title', e.target.value)}
        />
        <input
          className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-400"
          placeholder="Oficina destino"
          value={quotation.oficina}
          onChange={e => onChange('oficina', e.target.value)}
        />
      </div>
    </div>
  )
}
