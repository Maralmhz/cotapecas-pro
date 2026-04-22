import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const fmtBRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function QuotationCharts({ quotation }) {
  const { parts, shops, prices } = quotation

  if (shops.length === 0 || parts.length === 0) return null

  const barData = parts.map(part => {
    const row = { name: part.name.substring(0, 20) }
    shops.forEach(shop => {
      const key = `${part.id}_${shop.id}`
      const cell = prices[key]
      row[shop.name] = cell && cell.price ? parseFloat(cell.price) || 0 : 0
    })
    return row
  })

  const shopTotals = shops.map(shop => {
    const total = parts.reduce((acc, part) => {
      const key = `${part.id}_${shop.id}`
      const cell = prices[key]
      return acc + (cell && cell.price ? parseFloat(cell.price) || 0 : 0)
    }, 0)
    return { name: shop.name, value: total }
  }).filter(s => s.value > 0)

  return (
    <div className="bg-white border border-gray-300 rounded mb-3 p-3">
      <h3 className="font-semibold text-gray-700 mb-3">Comparacao de Precos por Peca</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => `R$${v}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => fmtBRL(v)} />
          <Legend />
          {shops.map((shop, i) => (
            <Bar key={shop.id} dataKey={shop.name} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {shopTotals.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-700 mt-4 mb-3">Total por Loja</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={shopTotals}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${fmtBRL(value)}`}
              >
                {shopTotals.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
