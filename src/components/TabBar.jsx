export default function TabBar({ tabs, activeTab, onSelectTab, onAddTab, onCloseTab }) {
  return (
    <div className="flex items-end bg-gray-200 border-b border-gray-400 overflow-x-auto min-h-[40px]">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`flex items-center gap-1 px-3 py-1.5 border border-b-0 border-gray-400 cursor-pointer text-sm whitespace-nowrap max-w-[200px] ${
            tab.id === activeTab
              ? 'bg-white border-b-white -mb-px z-10 font-medium'
              : 'bg-gray-100 hover:bg-gray-50'
          }`}
          onClick={() => onSelectTab(tab.id)}
        >
          <span className="truncate max-w-[140px]" title={tab.title}>{tab.title}</span>
          <button
            onClick={e => { e.stopPropagation(); onCloseTab(tab.id) }}
            className="ml-1 text-gray-400 hover:text-red-500 text-xs leading-none"
          >x</button>
        </div>
      ))}
      <button
        onClick={onAddTab}
        className="px-3 py-1.5 text-gray-600 hover:bg-gray-300 font-bold text-lg leading-none"
        title="Nova Aba"
      >+</button>
    </div>
  )
}
