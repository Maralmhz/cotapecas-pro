export default function TabBar({
  tabs,
  activeTab,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onExport,
  onChangeView,
}) {
  return (
    <div
      style={{ background: 'linear-gradient(135deg, #1a3f8f 0%, #2151a1 60%, #1d4ed8 100%)' }}
      className="flex items-stretch shadow-lg select-none relative"
    >
      <div className="flex items-end flex-1 overflow-x-auto gap-0.5 px-2 pt-2">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer text-xs font-medium whitespace-nowrap max-w-[200px] transition-all ${
              tab.id === activeTab
                ? 'bg-white text-blue-900 shadow-md'
                : 'bg-blue-800/50 text-blue-100 hover:bg-blue-700/60'
            }`}
            onClick={() => { onSelectTab(tab.id); onChangeView?.('cotacao') }}
          >
            <span className="truncate max-w-[140px]" title={tab.title}>
              {tab.oficina ? `${tab.oficina} | ` : ''}{tab.title}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onCloseTab(tab.id) }}
              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs transition-colors ${
                tab.id === activeTab
                  ? 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                  : 'hover:bg-blue-600 text-blue-300'
              }`}
            >x</button>
          </div>
        ))}
        <button
          onClick={() => { onAddTab(); onChangeView?.('cotacao') }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-blue-200 hover:bg-blue-700/50 text-sm font-bold transition-all mb-0"
          title="Nova Cotacao"
        >+ Nova</button>
      </div>

      <div className="flex items-center gap-2 px-3 border-l border-blue-700/40">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow"
          title="Exportar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar
        </button>
      </div>
    </div>
  )
}
