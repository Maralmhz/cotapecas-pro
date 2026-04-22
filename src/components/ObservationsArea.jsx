export default function ObservationsArea({ value, onChange }) {
  return (
    <div className="bg-white border border-gray-300 rounded p-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Observacoes Gerais:</p>
      <textarea
        className="w-full border border-gray-300 rounded p-2 text-sm h-28 resize-none focus:outline-none focus:border-blue-400"
        placeholder="Anotacoes livres sobre esta cotacao..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
