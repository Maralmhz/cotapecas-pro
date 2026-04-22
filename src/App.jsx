import { useState, useEffect } from 'react'
import useEventStore from './store/useEventStore'
import CotacaoTable from './components/CotacaoTable'
import ImportModal from './components/ImportModal'
import Dashboard from './components/Dashboard'
import RelatorioFechamento from './components/RelatorioFechamento'
import { calcularResumoEvento, formatarBRL } from './lib/calculations'

export default function App() {
  const {
    eventos, eventoAtivo, lojas, loading, view,
    carregarEventos, criarEvento, setEventoAtivo, setView, getEventoAtivo, adicionarLoja
  } = useEventStore()

  const [showImport, setShowImport] = useState(false)
  const [showNovoEvento, setShowNovoEvento] = useState(false)
  const [showNovaLoja, setShowNovaLoja] = useState(false)
  const [nomeEvento, setNomeEvento] = useState('')
  const [descEvento, setDescEvento] = useState('')
  const [nomeLoja, setNomeLoja] = useState('')

  useEffect(() => {
    carregarEventos()
  }, [])

  const eventoAtivoObj = getEventoAtivo()
  const resumo = eventoAtivoObj ? calcularResumoEvento(eventoAtivoObj) : null

  const handleCriarEvento = async () => {
    if (!nomeEvento.trim()) return
    await criarEvento(nomeEvento.trim(), descEvento.trim())
    setNomeEvento('')
    setDescEvento('')
    setShowNovoEvento(false)
  }

  const handleAdicionarLoja = async () => {
    if (!nomeLoja.trim()) return
    await adicionarLoja(nomeLoja.trim())
    setNomeLoja('')
    setShowNovaLoja(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0 overflow-y-auto">
          {/* Logo */}
          <div className="p-5 border-b border-gray-700">
            <h1 className="text-xl font-black text-white tracking-tight">CotaPecas Pro</h1>
            <p className="text-xs text-gray-400 mt-0.5">Sistema de Cotacao</p>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setView('cotacao')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                view === 'cotacao' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Cotacao
            </button>
            <button
              onClick={() => setView('relatorio')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                view === 'relatorio' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Relatorio
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Dashboard
            </button>
          </nav>

          {/* Eventos */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Eventos</span>
              <button
                onClick={() => setShowNovoEvento(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Novo
              </button>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {eventos.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => { setEventoAtivo(ev.id); setView('cotacao') }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    ev.id === eventoAtivo
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <p className="font-medium truncate">{ev.nome}</p>
                  <p className="text-xs opacity-60">{ev.parts?.length || 0} pecas</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lojas */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Lojas</span>
              <button
                onClick={() => setShowNovaLoja(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Loja
              </button>
            </div>
            <div className="space-y-1">
              {lojas.map(l => (
                <div key={l.id} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-800">
                  {l.nome}
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status */}
          {loading && (
            <div className="p-4 text-xs text-gray-500 text-center">Sincronizando...</div>
          )}
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
            <div>
              {eventoAtivoObj ? (
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{eventoAtivoObj.nome}</h2>
                  {resumo && (
                    <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                      <span>{resumo.totalPecas} pecas</span>
                      <span className="text-green-600 font-medium">{resumo.pecasCompradas} compradas</span>
                      <span>Total: <strong className="text-gray-800">{formatarBRL(resumo.totalComprado)}</strong></span>
                      {resumo.economia > 0 && (
                        <span className="text-green-600">Economia: {formatarBRL(resumo.economia)}</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Selecione ou crie um evento</p>
              )}
            </div>
            <div className="flex gap-3">
              {eventoAtivoObj && view === 'cotacao' && (
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
                >
                  Importar Pecas
                </button>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {view === 'dashboard' && <Dashboard />}
            {view === 'relatorio' && <RelatorioFechamento evento={eventoAtivoObj} />}
            {view === 'cotacao' && (
              eventoAtivoObj ? (
                <div className="p-4">
                  <CotacaoTable evento={eventoAtivoObj} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Bem-vindo ao CotaPecas Pro</h3>
                  <p className="text-gray-500 mb-6">Crie um novo evento para comecar a cotar pecas</p>
                  <button
                    onClick={() => setShowNovoEvento(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                  >
                    Criar Primeiro Evento
                  </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Modal Importar */}
      {showImport && eventoAtivoObj && (
        <ImportModal eventoId={eventoAtivoObj.id} onClose={() => setShowImport(false)} />
      )}

      {/* Modal Novo Evento */}
      {showNovoEvento && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Novo Evento</h2>
            <input
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
              placeholder="Nome do evento (ex: Revisao 50k - Gol)"
              value={nomeEvento}
              onChange={e => setNomeEvento(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCriarEvento()}
            />
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
              placeholder="Descricao (opcional)"
              value={descEvento}
              onChange={e => setDescEvento(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNovoEvento(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleCriarEvento}
                disabled={!nomeEvento.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Loja */}
      {showNovaLoja && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Nova Loja</h2>
            <input
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
              placeholder="Nome da loja"
              value={nomeLoja}
              onChange={e => setNomeLoja(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdicionarLoja()}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNovaLoja(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleAdicionarLoja}
                disabled={!nomeLoja.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
