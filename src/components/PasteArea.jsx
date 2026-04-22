import { useState } from 'react'

// Heuristic to detect if a line is a vehicle identification line (not a part)
// Matches patterns like: HB20 2023, COROLLA 2022, ONIX PLUS, plate patterns, chassis numbers
const VEHICLE_PATTERN = /\b(20[0-9]{2}|19[89][0-9])\b|\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b|\b[A-Z0-9]{17}\b/i
const CAR_BRANDS = /\b(CHEVROLET|GM|FIAT|FORD|VOLKSWAGEN|VW|HONDA|TOYOTA|HYUNDAI|KIA|NISSAN|RENAULT|PEUGEOT|CITROEN|MITSUBISHI|JEEP|DODGE|SUZUKI|CHERY|JAC|BYD|HB20|ONIX|COROLLA|CIVIC|PALIO|GOLO|POLO|GOL|SIENA|STRADA|HILUX|KWID|ARGO|CRETA|TUCSON|COMPASS|RENEGADE|RANGER|DUSTER)\b/i

function isVehicleLine(line) {
  return VEHICLE_PATTERN.test(line) || CAR_BRANDS.test(line)
}

export default function PasteArea({ onConvert, onTitleDetected }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)

  const analyze = (raw) => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
    let titleLine = null
    const parts = []
    for (const line of lines) {
      if (!titleLine && isVehicleLine(line)) {
        titleLine = line
      } else {
        parts.push(line)
      }
    }
    setPreview({ titleLine, partsCount: parts.length })
    return { titleLine, parts }
  }

  const handleChange = (val) => {
    setText(val)
    if (val.trim()) analyze(val)
    else setPreview(null)
  }

  const handleConvert = () => {
    if (!text.trim()) return
    const { titleLine, parts } = analyze(text)
    if (titleLine && onTitleDetected) onTitleDetected(titleLine)
    onConvert(parts.join('\n'))
    setText('')
    setPreview(null)
  }

  return (
    <div className="glass rounded-xl mb-4 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-blue-800">Cole aqui a lista de pecas</p>
        <span className="text-xs text-blue-400 font-medium">
          O sistema detecta automaticamente o nome do veiculo
        </span>
      </div>

      <textarea
        className="w-full border border-blue-200 rounded-xl p-3 text-sm font-mono h-28 resize-none bg-white/80 focus:bg-white transition-all placeholder-gray-300"
        placeholder={`HB20 2023 PRATA SIL7D35 JOAO SILVA\nFiltro de oleo\nFiltro de ar\nCorreia dentada\nVelas de ignicao`}
        value={text}
        onChange={e => handleChange(e.target.value)}
      />

      {preview && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {preview.titleLine && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Veiculo detectado: <strong>{preview.titleLine.substring(0, 40)}</strong>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {preview.partsCount} peca(s) para adicionar
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleConvert}
          className="btn-royal flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Converter em Planilha
        </button>
        <button
          onClick={() => { setText(''); setPreview(null) }}
          className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 font-medium transition-all"
        >Limpar</button>
      </div>
    </div>
  )
}
