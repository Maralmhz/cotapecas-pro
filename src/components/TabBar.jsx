import { useState } from 'react'

const BASE = import.meta.env.BASE_URL || '/'

export default function TabBar({
  tabs,
  activeTab,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onExport,
  activeView = 'cotacao',
  onChangeView,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{ background: 'linear-gradient(135deg, #1a3f8f 0%, #2151a1 60%, #1d4ed8 100%)' }}
      className="flex items-stretch shadow-lg select-none relative"
    >
      <div className="w-16 border-r border-blue-700/40 flex flex-col items-center py-2 gap-2 bg-blue-950/20 relative">
        <img
          src={`${BASE}logo.png`}
          alt="CotaPecas"
          className="h-8 w-8 object-contain"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />

        <button
          type="button"
          onClick={() => setMenuOpen(prev => !prev)}
          className="w-9 h-9 rounded-lg bg-blue-800/70 hover:bg-blue-700 text-white flex items-center justify-center"
          title="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute top-14 left-14 z-20 w-44 rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { onChangeView?.('dashboard'); setMenuOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => { onChangeView?.('configuracoes'); setMenuOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${activeView === 'configuracoes' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
            >
              Configurações
            </button>
            <button
              type="button"
              onClick={() => { onChangeView?.('cotacao'); setMenuOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${activeView === 'cotacao' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
            >
              Cotação
            </button>
          </div>
        )}
      </div>

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
        <a
          href="https://github.com/Maralmhz/cotapecas-pro"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-blue-100 hover:text-white underline-offset-2 hover:underline"
        >
          GitHub
        </a>
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-blue-200 hover:text-white underline-offset-2 hover:underline"
          title="Placeholder Supabase"
        >
          Supabase
        </a>
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
