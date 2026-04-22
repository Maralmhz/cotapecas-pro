import { useState, useEffect, useCallback } from 'react'
import TabBar from './components/TabBar'
import QuotationHeader from './components/QuotationHeader'
import PasteArea from './components/PasteArea'
import SpreadsheetTable from './components/SpreadsheetTable'
import PurchaseModal from './components/PurchaseModal'
import QuotationCharts from './components/QuotationCharts'
import ObservationsArea from './components/ObservationsArea'
import { supabase } from './lib/supabase'

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

export default function App() {
  const [tabs, setTabs] = useState([createEmptyQuotation(Date.now())])
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [purchaseModal, setPurchaseModal] = useState(null)
  const [saving, setSaving] = useState(false)

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

  const handlePasteConvert = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    updateQuotation(activeTab, q => ({
      parts: [...q.parts, ...lines.map((name, i) => ({ id: Date.now() + i, name, obs: '' }))]
    }))
  }

  const addPart = () => {
    updateQuotation(activeTab, q => ({
      parts: [...q.parts, { id: Date.now(), name: 'Nova Peca', obs: '' }]
    }))
  }

  const removePart = (partId) => {
    updateQuotation(activeTab, q => ({
      parts: q.parts.filter(p => p.id !== partId),
      prices: Object.fromEntries(Object.entries(q.prices).filter(([k]) => !k.startsWith(partId + '_')))
    }))
  }

  const updatePart = (partId, field, value) => {
    updateQuotation(activeTab, q => ({
      parts: q.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
    }))
  }

  const addShop = () => {
    updateQuotation(activeTab, q => ({
      shops: [...q.shops, { id: Date.now(), name: `Loja ${q.shops.length + 1}` }]
    }))
  }

  const removeShop = (shopId) => {
    updateQuotation(activeTab, q => ({
      shops: q.shops.filter(s => s.id !== shopId),
      prices: Object.fromEntries(Object.entries(q.prices).filter(([k]) => !k.endsWith('_' + shopId)))
    }))
  }

  const updateShopName = (shopId, name) => {
    updateQuotation(activeTab, q => ({
      shops: q.shops.map(s => s.id === shopId ? { ...s, name } : s)
    }))
  }

  const updatePrice = (partId, shopId, value) => {
    const key = `${partId}_${shopId}`
    updateQuotation(activeTab, q => ({
      prices: { ...q.prices, [key]: { ...q.prices[key], price: value } }
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
      prices: { ...q.prices, [key]: { ...q.prices[key], isPurchased: true, paymentMethod } }
    }))
    setPurchaseModal(null)
  }

  const cancelPurchase = () => {
    if (!purchaseModal) return
    const { key } = purchaseModal
    updateQuotation(activeTab, q => ({
      prices: { ...q.prices, [key]: { ...q.prices[key], isPurchased: false, paymentMethod: '' } }
    }))
    setPurchaseModal(null)
  }

  const q = getActiveQuotation()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TabBar tabs={tabs} activeTab={activeTab} onSelectTab={setActiveTab} onAddTab={addTab} onCloseTab={closeTab} />
      {q && (
        <div className="flex-1 p-3 max-w-full overflow-auto">
          <QuotationHeader
            quotation={q}
            onChange={(field, value) => updateQuotation(q.id, qt => ({ [field]: value }))}
          />
          <PasteArea onConvert={handlePasteConvert} />
          <SpreadsheetTable
            quotation={q}
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
            onChange={v => updateQuotation(q.id, qt => ({ observations: v }))}
          />
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
    </div>
  )
}
