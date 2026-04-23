import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const fmtBRL = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const parseNumber = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs rounded-md px-3 py-2 shadow-lg border border-slate-700">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {fmtBRL(parseNumber(entry.value))}
        </p>
      ))}
    </div>
  )
}

export default function QuotationCharts({ quotation }) {
  const { parts, shops, prices } = quotation

  if (shops.length === 0 || parts.length === 0) return null

  const comparisonData = parts.map((part) => {
    const row = { name: (part.name || 'Sem nome').substring(0, 22) }
    shops.forEach((shop) => {
      const key = `${part.id}_${shop.id}`
      row[shop.name] = parseNumber(prices[key]?.price)
    })
    return row
  })

  const shopTotals = shops
    .map((shop) => {
      const total = parts.reduce((acc, part) => {
        const key = `${part.id}_${shop.id}`
        const qty = parseNumber(part.quantity) || 1
        return acc + (parseNumber(prices[key]?.price) * qty)
      }, 0)
      return { name: shop.name, total }
    })
    .filter((item) => item.total > 0)

  const rankingData = [...shopTotals]
    .sort((a, b) => a.total - b.total)
    .map((item, index) => ({ ...item, ranking: `#${index + 1}` }))

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-3 p-4 space-y-5">
      <h3 className="font-semibold text-gray-700">Análise visual de cotação</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 10, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
            <Tooltip content={<DarkTooltip />} />
            <Legend />
            {shops.map((shop, i) => (
              <Bar
                key={shop.id}
                dataKey={shop.name}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                animationDuration={650}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {shopTotals.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-64 border border-slate-100 rounded-lg p-2">
            <h4 className="text-sm font-semibold text-slate-700 px-2">Distribuição por loja</h4>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={shopTotals}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {shopTotals.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64 border border-slate-100 rounded-lg p-2">
            <h4 className="text-sm font-semibold text-slate-700 px-2">Ranking de lojas (menor total)</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={rankingData} layout="vertical" margin={{ top: 8, right: 20, left: 18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} animationDuration={650}>
                  {rankingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
