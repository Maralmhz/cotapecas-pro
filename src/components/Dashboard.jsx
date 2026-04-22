import useEventStore from '../store/useEventStore'
import { calcularResumoEvento, formatarBRL } from '../lib/calculations'

export default function Dashboard() {
  const eventos = useEventStore(s => s.eventos)
  const setView = useEventStore(s => s.setView)
  const setEventoAtivo = useEventStore(s => s.setEventoAtivo)

  // Stats gerais
  const totalEventos = eventos.length
  const totalPecas = eventos.reduce((acc, ev) => acc + (ev.parts?.length || 0), 0)
  const totalGasto = eventos.reduce((acc, ev) => {
    const r = calcularResumoEvento(ev)
    return acc + (r.totalComprado || 0)
  }, 0)
  const totalEconomizado = eventos.reduce((acc, ev) => {
    const r = calcularResumoEvento(ev)
    return acc + (r.economia || 0)
  }, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Historico completo de {totalEventos} cotacoes</p>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Eventos', value: totalEventos, color: 'blue', icon: '📋' },
          { label: 'Total Pecas', value: totalPecas, color: 'purple', icon: '🔧' },
          { label: 'Total Gasto', value: formatarBRL(totalGasto), color: 'red', icon: '💰' },
          { label: 'Total Economizado', value: formatarBRL(totalEconomizado), color: 'green', icon: '💚' },
        ].map(card => (
          <div key={card.label} className={`bg-white rounded-2xl border p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de eventos */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Todos os Eventos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Evento</th>
                <th className="text-center p-4 font-semibold text-gray-700">Pecas</th>
                <th className="text-center p-4 font-semibold text-gray-700">Compradas</th>
                <th className="text-center p-4 font-semibold text-gray-700">Total Gasto</th>
                <th className="text-center p-4 font-semibold text-gray-700">Melhor Preco</th>
                <th className="text-center p-4 font-semibold text-gray-700">Economia</th>
                <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev, i) => {
                const r = calcularResumoEvento(ev)
                return (
                  <tr key={ev.id} className={`border-t hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{ev.nome}</p>
                      {ev.descricao && <p className="text-xs text-gray-500">{ev.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(ev.created_at).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="p-4 text-center text-gray-700">{r.totalPecas}</td>
                    <td className="p-4 text-center">
                      <span className="text-green-700 font-medium">{r.pecasCompradas}</span>
                      <span className="text-gray-400">/{r.totalPecas}</span>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-900">{formatarBRL(r.totalComprado)}</td>
                    <td className="p-4 text-center text-green-700 font-semibold">{formatarBRL(r.totalMelhorPreco)}</td>
                    <td className="p-4 text-center">
                      <span className={`font-semibold ${r.economia > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {r.economia > 0 ? `+ ${formatarBRL(r.economia)}` : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        ev.status === 'fechado'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {ev.status === 'fechado' ? 'Fechado' : 'Aberto'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => { setEventoAtivo(ev.id); setView('cotacao') }}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
