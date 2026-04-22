import useEventStore from '../store/useEventStore'
import { gerarRelatorioFechamento, formatarBRL, calcularResumoEvento } from '../lib/calculations'

export default function RelatorioFechamento({ evento }) {
  const lojas = useEventStore(s => s.lojas)
  const fecharEvento = useEventStore(s => s.fecharEvento)

  if (!evento) return <div className="p-8 text-gray-400 text-center">Selecione um evento para ver o relatorio.</div>

  const relatorio = gerarRelatorioFechamento({ parts: evento.parts, stores: lojas })
  const resumo = calcularResumoEvento(evento)
  const lojasData = Object.values(relatorio)

  const exportarCSV = () => {
    const linhas = []
    linhas.push(['Loja', 'Peca', 'Valor', 'Forma Pagamento'].join(','))
    lojasData.forEach(loja => {
      loja.itens.forEach(item => {
        linhas.push([loja.nome, item.peca, formatarBRL(item.valor), item.formaPagamento].join(','))
      })
      linhas.push([loja.nome, 'SUBTOTAL', formatarBRL(loja.subtotal), ''].join(','))
      linhas.push([])
    })
    linhas.push(['TOTAL GERAL', '', formatarBRL(resumo.totalComprado), ''].join(','))
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${evento.nome}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const imprimir = () => window.print()

  return (
    <div className="p-6 space-y-6" id="relatorio-print">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorio de Fechamento</h1>
          <p className="text-gray-500 text-sm mt-1">{evento.nome}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold"
          >
            Exportar CSV
          </button>
          <button
            onClick={imprimir}
            className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold"
          >
            Imprimir
          </button>
          {evento.status !== 'fechado' && (
            <button
              onClick={() => fecharEvento(evento.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold"
            >
              Fechar Evento
            </button>
          )}
        </div>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pecas Compradas', value: `${resumo.pecasCompradas}/${resumo.totalPecas}` },
          { label: 'Total Gasto', value: formatarBRL(resumo.totalComprado) },
          { label: 'Se Tivesse Menor Preco', value: formatarBRL(resumo.totalMelhorPreco) },
          { label: 'Economia', value: formatarBRL(resumo.economia) },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Por loja */}
      <div className="space-y-4">
        {lojasData.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Nenhuma peca selecionada para compra ainda.</div>
        ) : lojasData.map(loja => (
          <div key={loja.nome} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">{loja.nome}</h3>
              <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                {loja.itens.length} peca{loja.itens.length !== 1 ? 's' : ''} | {formatarBRL(loja.subtotal)}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Peca</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Valor</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Forma Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {loja.itens.map((item, i) => (
                  <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-4 font-medium text-gray-800">{item.peca}</td>
                    <td className="p-4 text-center font-semibold text-gray-900">{formatarBRL(item.valor)}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.formaPagamento === 'boleto' ? 'bg-yellow-100 text-yellow-800' :
                        item.formaPagamento === 'cartao' ? 'bg-blue-100 text-blue-800' :
                        item.formaPagamento === 'pix' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.formaPagamento || 'dinheiro'}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="p-4 text-gray-800">Subtotal</td>
                  <td className="p-4 text-center text-gray-900 text-base">{formatarBRL(loja.subtotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {lojasData.length > 0 && (
        <div className="bg-gray-900 text-white rounded-2xl p-6 flex items-center justify-between">
          <span className="text-lg font-bold">TOTAL GERAL</span>
          <span className="text-3xl font-black">{formatarBRL(resumo.totalComprado)}</span>
        </div>
      )}
    </div>
  )
}
