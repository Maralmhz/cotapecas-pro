import { useState } from 'react'
import { parsearTextoColado } from '../lib/calculations'
import useEventStore from '../store/useEventStore'

export default function ImportModal({ eventoId, onClose }) {
  const [texto, setTexto] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const importarPecas = useEventStore(s => s.importarPecas)

  const handlePreview = () => {
    if (!texto.trim()) return
    const resultado = parsearTextoColado(texto)
    setPreview(resultado)
  }

  const handleImportar = async () => {
    if (!preview) return
    setLoading(true)
    await importarPecas(eventoId, preview.parts, preview.stores)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importar Pecas</h2>
            <p className="text-sm text-gray-500 mt-1">Cole o texto da sua planilha ou lista de pecas</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {!preview ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Formato aceito:</p>
                <pre className="text-xs whitespace-pre-wrap font-mono">{`Peca; Loja1; Loja2; Loja3
Filtro de Oleo; 25.90; 28.00; 22.50
Vela de Ignicao; 15.00; 14.50; 16.00`}</pre>
                <p className="mt-2">Separadores aceitos: tab, ponto-e-virgula, virgula ou espacos multiplos.</p>
              </div>

              <textarea
                className="w-full h-56 border-2 border-gray-200 rounded-xl p-3 font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Cole sua planilha aqui..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 justify-end">
                <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button
                  onClick={handlePreview}
                  disabled={!texto.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  Analisar Texto
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-800 mb-1">Encontrado:</p>
                <p className="text-sm text-green-700">{preview.parts.length} pecas | {preview.stores.length} lojas: {preview.stores.join(', ')}</p>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b">Peca</th>
                        {preview.stores.map(s => (
                          <th key={s} className="text-center p-3 font-semibold text-gray-700 border-b">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.parts.map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border-b font-medium">{p.name}</td>
                          {preview.stores.map(s => (
                            <td key={s} className="p-3 border-b text-center text-gray-600">
                              {p.prices[s] ? `R$ ${parseFloat(p.prices[s]).toFixed(2)}` : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setPreview(null)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">Voltar</button>
                <button
                  onClick={handleImportar}
                  disabled={loading}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Importando...' : `Importar ${preview.parts.length} Pecas`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
