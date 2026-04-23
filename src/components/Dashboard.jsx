import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const fmtBRL = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const parseNumber = (value) => {
  const parsed = parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export default function Dashboard({ tabs = [], onOpenQuotation }) {
  const quotationSummaries = tabs.map((tab) => {
    const parts = tab.parts || []
    const shops = tab.shops || []
    const prices = tab.prices || {}

    const shopTotals = shops.map((shop) => {
      const total = parts.reduce((acc, part) => {
        const key = `${part.id}_${shop.id}`
        const price = parseNumber(prices[key]?.price)
        const qty = parseNumber(part.quantity) || 1
        return acc + (price * qty)
      }, 0)
      return { id: shop.id, name: shop.name, total }
    }).filter((shop) => shop.total > 0)

    const totalQuoted = shopTotals.reduce((acc, shop) => acc + shop.total, 0)
    const best = shopTotals.reduce((bestShop, current) => {
      if (!bestShop) return current
      return current.total < bestShop.total ? current : bestShop
    }, null)
    const worst = shopTotals.reduce((worstShop, current) => {
      if (!worstShop) return current
      return current.total > worstShop.total ? current : worstShop
    }, null)

    const savingsPct = best && worst && best.total > 0
      ? ((worst.total - best.total) / worst.total) * 100
      : 0

    return {
      id: tab.id,
      title: tab.title || 'Sem título',
      oficina: tab.oficina || '-',
      totalParts: parts.length,
      totalQuoted,
      bestTotal: best?.total || 0,
      savingsPct,
    }
  })

  const totalQuotations = tabs.length
  const totalParts = quotationSummaries.reduce((acc, tab) => acc + tab.totalParts, 0)
  const totalQuoted = quotationSummaries.reduce((acc, tab) => acc + tab.totalQuoted, 0)
  const savingsAverage = quotationSummaries.length
    ? quotationSummaries.reduce((acc, tab) => acc + tab.savingsPct, 0) / quotationSummaries.length
    : 0

  return (
    <section className="bg-white border border-blue-100 rounded-xl shadow-sm p-4 mb-3 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total de cotações" value={totalQuotations} color="text-blue-700" />
        <KpiCard title="Total de peças" value={totalParts} color="text-violet-700" />
        <KpiCard title="Valor total cotado" value={fmtBRL(totalQuoted)} color="text-emerald-700" />
        <KpiCard title="Economia média" value={`${savingsAverage.toFixed(1)}%`} color="text-amber-600" />
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Cotação</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Oficina</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Peças</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600">Total cotado</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600">Melhor total</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600">Economia %</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {quotationSummaries.map((tab, index) => (
              <tr key={tab.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                <td className="px-3 py-2 text-slate-900 font-medium">{tab.title}</td>
                <td className="px-3 py-2 text-slate-600">{tab.oficina}</td>
                <td className="px-3 py-2 text-center text-slate-600">{tab.totalParts}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmtBRL(tab.totalQuoted)}</td>
                <td className="px-3 py-2 text-right text-emerald-700">{fmtBRL(tab.bestTotal)}</td>
                <td className="px-3 py-2 text-right text-amber-600 font-semibold">{tab.savingsPct.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenQuotation?.(tab.id)}
                    className="text-[11px] font-semibold bg-blue-600 text-white px-2.5 py-1 rounded-md hover:bg-blue-700"
                  >
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
            {quotationSummaries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  Nenhuma cotação cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-64 rounded-lg border border-slate-100 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={quotationSummaries} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
            <XAxis dataKey="title" tick={{ fontSize: 11 }} tickFormatter={(label) => label.slice(0, 14)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `R$${Math.round(value)}`} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              formatter={(value) => fmtBRL(parseNumber(value))}
            />
            <Bar dataKey="totalQuoted" radius={[4, 4, 0, 0]}>
              {quotationSummaries.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function KpiCard({ title, value, color }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
