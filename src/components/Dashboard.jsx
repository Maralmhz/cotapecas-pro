import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const fmtBRL = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const parseNumber = (value) => {
  const parsed = parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-md shadow-xl">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((item) => (
        <p key={`${item.dataKey}-${item.name}`} style={{ color: item.color }}>
          {item.name || item.dataKey}: {typeof item.value === 'number' ? fmtBRL(item.value) : item.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard({ tabs = [], onOpenTab, onOpenQuotation }) {
  const [search, setSearch] = useState('')

  const openTab = onOpenTab || onOpenQuotation

  const metrics = useMemo(() => {
    const quotationRows = tabs.map((tab) => {
      const parts = tab.parts || []
      const shops = tab.shops || []
      const prices = tab.prices || {}

      const totalsPerShop = shops
        .map((shop) => {
          const total = parts.reduce((acc, part) => {
            const key = `${part.id}_${shop.id}`
            const qty = parseNumber(part.quantity) || 1
            const price = parseNumber(prices[key]?.price)
            return acc + (price * qty)
          }, 0)

          return {
            shopId: shop.id,
            shopName: shop.name || 'Loja',
            total,
          }
        })
        .filter((shop) => shop.total > 0)

      const minShop = totalsPerShop.reduce((best, current) => {
        if (!best) return current
        return current.total < best.total ? current : best
      }, null)

      const maxShop = totalsPerShop.reduce((worst, current) => {
        if (!worst) return current
        return current.total > worst.total ? current : worst
      }, null)

      const economyValue = minShop && maxShop ? Math.max(maxShop.total - minShop.total, 0) : 0
      const economyPct = maxShop?.total ? (economyValue / maxShop.total) * 100 : 0

      return {
        id: tab.id,
        title: tab.title || 'Sem nome',
        oficina: tab.oficina || 'Sem oficina',
        partCount: parts.length,
        bestTotal: minShop?.total || 0,
        maxTotal: maxShop?.total || 0,
        economyValue,
        economyPct,
        cheapestShopName: minShop?.shopName || null,
        totalsPerShop,
      }
    })

    const totalQuotations = tabs.length
    const totalParts = quotationRows.reduce((acc, row) => acc + row.partCount, 0)
    const totalQuoted = quotationRows.reduce((acc, row) => acc + row.bestTotal, 0)
    const totalEconomy = quotationRows.reduce((acc, row) => acc + row.economyValue, 0)
    const averageEconomyPct = quotationRows.length
      ? quotationRows.reduce((acc, row) => acc + row.economyPct, 0) / quotationRows.length
      : 0

    const shopStatsMap = new Map()
    quotationRows.forEach((row) => {
      row.totalsPerShop.forEach((shop) => {
        if (!shopStatsMap.has(shop.shopId)) {
          shopStatsMap.set(shop.shopId, {
            shopId: shop.shopId,
            name: shop.shopName,
            totalAccumulated: 0,
            cheapestWins: 0,
          })
        }

        const entry = shopStatsMap.get(shop.shopId)
        entry.totalAccumulated += shop.total
      })

      if (row.cheapestShopName) {
        const winner = [...shopStatsMap.values()].find((shop) => shop.name === row.cheapestShopName)
        if (winner) winner.cheapestWins += 1
      }
    })

    const shopRanking = [...shopStatsMap.values()]
      .sort((a, b) => b.cheapestWins - a.cheapestWins || a.totalAccumulated - b.totalAccumulated)

    const lowestAccumulatedShop = [...shopStatsMap.values()]
      .sort((a, b) => a.totalAccumulated - b.totalAccumulated)[0]

    const oficinasMap = tabs.reduce((acc, tab) => {
      const oficina = tab.oficina?.trim() || 'Sem oficina'
      acc.set(oficina, (acc.get(oficina) || 0) + 1)
      return acc
    }, new Map())

    const oficinaRows = [...oficinasMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const economyByQuotation = quotationRows.map((row) => ({
      name: row.title,
      economia: row.economyValue,
    }))

    return {
      kpis: {
        totalQuotations,
        totalParts,
        totalQuoted,
        totalEconomy,
        averageEconomyPct,
      },
      quotationRows,
      shopRanking,
      lowestAccumulatedShop,
      bestShopByWins: shopRanking[0],
      oficinaRows,
      economyByQuotation,
    }
  }, [tabs])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return metrics.quotationRows

    return metrics.quotationRows.filter((row) =>
      row.title.toLowerCase().includes(query) ||
      row.oficina.toLowerCase().includes(query)
    )
  }, [search, metrics.quotationRows])

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-3 space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-800">Dashboard Geral</h2>
        <p className="text-sm text-slate-500">Visão consolidada de todas as cotações salvas</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total de cotações" value={metrics.kpis.totalQuotations} color="text-blue-700" />
        <KpiCard title="Total de peças" value={metrics.kpis.totalParts} color="text-violet-700" />
        <KpiCard title="Valor total cotado" value={fmtBRL(metrics.kpis.totalQuoted)} color="text-emerald-700" />
        <KpiCard title="Economia total" value={fmtBRL(metrics.kpis.totalEconomy)} color="text-amber-600" />
        <KpiCard title="Média economia (%)" value={`${metrics.kpis.averageEconomyPct.toFixed(1)}%`} color="text-rose-600" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Ranking de lojas (mais baratas)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.shopRanking} layout="vertical" margin={{ top: 10, right: 16, left: 20, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="cheapestWins" name="Vezes mais barata" radius={[0, 4, 4, 0]} animationDuration={600}>
                  {metrics.shopRanking.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">
            Loja mais barata: <strong>{metrics.bestShopByWins?.name || '-'}</strong> · menor acumulado:{' '}
            <strong>{metrics.lowestAccumulatedShop?.name || '-'}</strong>
          </p>
        </Panel>

        <Panel title="Distribuição do valor cotado por loja">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.shopRanking}
                  dataKey="totalAccumulated"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                  animationDuration={600}
                >
                  {metrics.shopRanking.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Carros por oficina">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.oficinaRows} margin={{ top: 10, right: 16, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Qtde cotações" radius={[4, 4, 0, 0]} fill="#3b82f6" animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-32 overflow-auto border border-slate-100 rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1.5">Oficina</th>
                  <th className="text-right px-2 py-1.5">Cotações</th>
                </tr>
              </thead>
              <tbody>
                {metrics.oficinaRows.map((row) => (
                  <tr key={row.name} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{row.name}</td>
                    <td className="px-2 py-1.5 text-right font-medium">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Economia por cotação">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.economyByQuotation} margin={{ top: 10, right: 16, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(label) => label.slice(0, 14)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${Math.round(v)}`} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="economia" name="Economia" radius={[4, 4, 0, 0]} animationDuration={600}>
                  {metrics.economyByQuotation.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">
            Total economizado geral: <strong>{fmtBRL(metrics.kpis.totalEconomy)}</strong>
          </p>
        </Panel>
      </div>

      <Panel title="Lista completa de cotações">
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da cotação ou oficina..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-lg border border-slate-200 overflow-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Cotação</th>
                <th className="text-left px-3 py-2">Oficina</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-right px-3 py-2">Economia</th>
                <th className="text-right px-3 py-2">Peças</th>
                <th className="text-right px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.title}</td>
                  <td className="px-3 py-2 text-slate-600">{row.oficina}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(row.bestTotal)}</td>
                  <td className="px-3 py-2 text-right text-amber-600 font-semibold">{fmtBRL(row.economyValue)}</td>
                  <td className="px-3 py-2 text-right">{row.partCount}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openTab?.(row.id)}
                      className="text-xs px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 px-3 py-6">
                    Nenhuma cotação encontrada para esta busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
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

function Panel({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 p-3 bg-white">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
      {children}
    </section>
  )
}
