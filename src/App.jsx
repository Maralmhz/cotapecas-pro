import { useState, useCallback, useEffect } from 'react'
import TabBar from './components/TabBar'
import QuotationHeader from './components/QuotationHeader'
import PasteArea from './components/PasteArea'
import SpreadsheetTable from './components/SpreadsheetTable'
import PurchaseModal from './components/PurchaseModal'
import QuotationCharts from './components/QuotationCharts'
import Dashboard from './components/Dashboard'
import ObservationsArea from './components/ObservationsArea'
import ExportModal from './components/ExportModal'
import Settings from './components/Settings'
import { normalizePartName, parseParts, parsePrices, parseVehicle } from './lib/parseBudgetText'

const TABS_STORAGE_KEY = 'cotapecas_tabs_v1'

const SETTINGS_STORAGE_KEY = 'cotapecas_settings_v1'

const defaultSettings = {
  companyName: '',
  userName: '',
  companyLogo: '',
  theme: 'claro',
  currency: 'BRL',
  showZeroValues: true,
  showEconomyPercent: true,
  showCodeColumn: true,
  showQuantityColumn: true,
}

const getInitialSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw)
    return { ...defaultSettings, ...parsed }
  } catch {
    return defaultSettings
  }
}


const createEmptyQuotation = (id) => ({
  id,
  title: 'Nova Cotacao',
  oficina: '',
  vehiclePhoto: null,
  observations: '',
  parts: [],
  shops: [],
  prices: {},
})

const normalizeQuotation = (tab) => ({
  id: tab.id,
  title: tab.title || 'Nova Cotacao',
  oficina: tab.oficina || '',
  vehiclePhoto: tab.vehiclePhoto || null,
  observations: tab.observations || '',
  parts: (tab.parts || []).map((part) => ({
    id: part.id,
    name: part.name || '',
    code: part.code || '',
    quantity: part.quantity || '',
    obs: part.obs || '',
  })),
  shops: (tab.shops || []).map((shop) => ({ id: shop.id, name: shop.name || 'Loja' })),
  prices: tab.prices || {},
})

const getInitialTabs = () => {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY)
    if (!raw) return [createEmptyQuotation(Date.now())]

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return [createEmptyQuotation(Date.now())]

    return parsed.map(normalizeQuotation)
  } catch {
    return [createEmptyQuotation(Date.now())]
  }
}

const getTokenSimilarity = (left, right) => {
  if (!left || !right) return 0
  if (left === right) return 1

  const leftTokens = left.split(' ').filter(Boolean)
  const rightTokens = right.split(' ').filter(Boolean)
  const common = leftTokens.filter((token) => rightTokens.includes(token)).length
  if (common === 0) return 0

  return (2 * common) / (leftTokens.length + rightTokens.length)
}

const getBestPartMatch = (normalizedParts, targetName) => {
  let best = null
  let bestScore = 0

  for (const part of normalizedParts) {
    if (part.normalized === targetName) return part

    const tokenSimilarity = getTokenSimilarity(part.normalized, targetName)
    const containsAsIsolatedWord =
      part.normalized.split(' ').includes(targetName) ||
      targetName.split(' ').includes(part.normalized)

    let score = tokenSimilarity
    if (containsAsIsolatedWord && tokenSimilarity < 0.7) {
      score = Math.min(score, 0.55)
    }

    if (score > bestScore) {
      best = part
      bestScore = score
    }
  }

  return bestScore >= 0.7 ? best : null
}

export default function App() {
  const [tabs, setTabs] = useState(getInitialTabs)
  const [activeTab, setActiveTab] = useState(null)
  const [purchaseModal, setPurchaseModal] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [activeView, setActiveView] = useState('cotacao')
  const [settings, setSettings] = useState(getInitialSettings)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs))
  }, [tabs])

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    document.documentElement.classList.toggle('dark', settings.theme === 'escuro')
  }, [settings])

  useEffect(() => {
    if (!activeTab && tabs.length > 0) setActiveTab(tabs[0].id)
  }, [activeTab, tabs])

  const getActiveQuotation = () => tabs.find(t => t.id === activeTab)

  const updateQuotation = useCallback((id, updater) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updater(t) } : t))
  }, [])

  const addTab = () => {
    const newQ = createEmptyQuotation(Date.now())
    setTabs(prev => [...prev, newQ])
    setActiveTab(newQ.id)
  }

  const closeTab = (id) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (next.length === 0) {
        const newQ = createEmptyQuotation(Date.now())
        setActiveTab(newQ.id)
        return [newQ]
      }
      if (activeTab === id) setActiveTab(next[next.length - 1].id)
      return next
    })
  }

  const handleBudgetImport = (text, parsedData) => {
    if (!text.trim()) return
    const parsed = parsedData || {
      titleLine: parseVehicle(text),
      parts: parseParts(text),
      ...parsePrices(text),
    }
    const hasPrices = parsed.items && parsed.items.length > 0

    if (!hasPrices) {
      const newQ = createEmptyQuotation(Date.now())
      const parts = (parsed.parts || []).map((name, i) => ({
        id: Date.now() + i,
        name,
        code: '',
        quantity: '',
        obs: '',
      }))
      const quotation = {
        ...newQ,
        title: parsed.titleLine || newQ.title,
        parts,
      }
      setTabs(prev => [...prev, quotation])
      setActiveTab(quotation.id)
      setActiveView('cotacao')
      return
    }

    updateQuotation(activeTab, (q) => {
      const normalizedParts = q.parts.map((part) => ({
        id: part.id,
        normalized: normalizePartName(part.name),
      }))

      let shopId = q.shops.find((shop) => normalizePartName(shop.name) === normalizePartName(parsed.storeName || ''))?.id
      const shops = [...q.shops]
      if (!shopId) {
        shopId = Date.now()
        shops.push({ id: shopId, name: parsed.storeName || `Loja ${q.shops.length + 1}` })
      }

      const nextPrices = { ...q.prices }
      for (const item of parsed.items) {
        const bestPart = getBestPartMatch(normalizedParts, item.normalizedName)
        if (!bestPart) continue
        const key = `${bestPart.id}_${shopId}`
        const currentCell = nextPrices[key]
        if (!currentCell?.price || item.price < Number(currentCell.price)) {
          nextPrices[key] = { ...(currentCell || {}), price: item.price }
        }
      }

      return {
        title: parsed.titleLine || q.title,
        shops,
        prices: nextPrices,
      }
    })
  }

  const addPart = () => {
    updateQuotation(activeTab, q => ({
      parts: [...q.parts, { id: Date.now(), name: 'Nova Peca', code: '', quantity: '', obs: '' }],
    }))
  }

  const removePart = (partId) => {
    updateQuotation(activeTab, q => ({
      parts: q.parts.filter(p => p.id !== partId),
      prices: Object.fromEntries(Object.entries(q.prices).filter(([k]) => !k.startsWith(partId + '_'))),
    }))
  }

  const updatePart = (partId, field, value) => {
    updateQuotation(activeTab, q => ({
      parts: q.parts.map(p => p.id === partId ? { ...p, [field]: value } : p),
    }))
  }

  const addShop = () => {
    updateQuotation(activeTab, q => ({
      shops: [...q.shops, { id: Date.now(), name: `Loja ${q.shops.length + 1}` }],
    }))
  }

  const removeShop = (shopId) => {
    updateQuotation(activeTab, q => ({
      shops: q.shops.filter(s => s.id !== shopId),
      prices: Object.fromEntries(Object.entries(q.prices).filter(([k]) => !k.endsWith('_' + shopId))),
    }))
  }

  const updateShopName = (shopId, name) => {
    updateQuotation(activeTab, q => ({
      shops: q.shops.map(s => s.id === shopId ? { ...s, name } : s),
    }))
  }

  const updatePrice = (partId, shopId, value) => {
    const key = `${partId}_${shopId}`
    updateQuotation(activeTab, q => ({
      prices: { ...q.prices, [key]: { ...(q.prices[key] || {}), price: value } },
    }))
  }

  const handleCellClick = (partId, shopId) => {
    const q = getActiveQuotation()
    const key = `${partId}_${shopId}`
    const cell = q.prices[key] || {}
    const part = q.parts.find(p => p.id === partId)
    const shop = q.shops.find(s => s.id === shopId)
    setPurchaseModal({ partId, shopId, key, partName: part?.name, shopName: shop?.name, price: cell.price || '', isPurchased: cell.isPurchased || false, paymentMethod: cell.paymentMethod || '' })
  }

  const confirmPurchase = (paymentMethod) => {
    if (!purchaseModal) return
    const { key } = purchaseModal
    updateQuotation(activeTab, q => ({
      prices: { ...q.prices, [key]: { ...(q.prices[key] || {}), isPurchased: true, paymentMethod } },
    }))
    setPurchaseModal(null)
  }

  const cancelPurchase = () => {
    if (!purchaseModal) return
    const { key } = purchaseModal
    updateQuotation(activeTab, q => ({
      prices: { ...q.prices, [key]: { ...(q.prices[key] || {}), isPurchased: false, paymentMethod: '' } },
    }))
    setPurchaseModal(null)
  }

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettingsNow = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    setSaveMessage('Configurações salvas com sucesso')
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings))
    setSaveMessage('Configurações resetadas')
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const saveQuotationNow = () => {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs))
    setSaveMessage('Cotação salva com sucesso')
    setTimeout(() => setSaveMessage(''), 2000)
  }

  const q = getActiveQuotation()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 p-3 border-b border-slate-200 bg-white">
        <img src="/logo.png" alt="CotaPeças Pro" className="h-10 w-auto object-contain" />
      </header>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onAddTab={addTab}
        onCloseTab={closeTab}
        onExport={() => setShowExport(true)}
        activeView={activeView}
        onChangeView={setActiveView}
      />
      {q && (
        <div className="flex-1 p-3 max-w-full overflow-auto">
          <div className="flex items-center justify-end gap-2 mb-2">
            {saveMessage && <span className="text-xs text-emerald-600 font-medium">{saveMessage}</span>}
            <button
              type="button"
              onClick={saveQuotationNow}
              className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Salvar Cotação
            </button>
          </div>
          {activeView === 'dashboard' && (
            <Dashboard
              tabs={tabs}
              onOpenTab={(id) => {
                setActiveTab(id)
                setActiveView('cotacao')
              }}
            />
          )}

          {activeView === 'configuracoes' && (
            <Settings
              settings={settings}
              onChange={updateSetting}
              onSave={saveSettingsNow}
              onReset={resetSettings}
            />
          )}

          {activeView === 'cotacao' && (
            <>
              <QuotationHeader
                quotation={q}
                onChange={(field, value) => updateQuotation(q.id, () => ({ [field]: value }))}
              />
              <PasteArea
                onImport={handleBudgetImport}
              />
              <SpreadsheetTable
                quotation={q}
                settings={settings}
                onAddPart={addPart}
                onRemovePart={removePart}
                onUpdatePart={updatePart}
                onAddShop={addShop}
                onRemoveShop={removeShop}
                onUpdateShopName={updateShopName}
                onUpdatePrice={updatePrice}
                onCellClick={handleCellClick}
              />
              <QuotationCharts quotation={q} />
              <ObservationsArea
                value={q.observations}
                onChange={v => updateQuotation(q.id, () => ({ observations: v }))}
              />
            </>
          )}
        </div>
      )}
      {purchaseModal && (
        <PurchaseModal
          modal={purchaseModal}
          onConfirm={confirmPurchase}
          onCancel={cancelPurchase}
          onClose={() => setPurchaseModal(null)}
        />
      )}
      {showExport && q && (
        <ExportModal
          quotation={q}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
