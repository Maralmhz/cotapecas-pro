import { useState } from 'react'

const fmtBRL = (v) => {
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PurchaseModal({ modal, onConfirm, onCancel, onClose }) {
  const [selected, setSelected] = useState(modal.paymentMethod || '')

  const methods = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'cartao', label: 'Cartao' },
    { value: 'pix', label: 'Pix' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 min-w-[320px] max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Comprar: {modal.partName}</h3>
        <p className="text-sm text-gray-600 mb-1">Loja: <strong>{modal.shopName}</strong></p>
        <p className="text-2xl font-bold text-blue-700 mb-4">{fmtBRL(modal.price)}</p>

        <p className="text-sm font-medium mb-2">Forma de Pagamento:</p>
        <div className="flex flex-col gap-2 mb-5">
          {methods.map(m => (
            <label key={m.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value={m.value}
                checked={selected === m.value}
                onChange={() => setSelected(m.value)}
              />
              <span>{m.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          {modal.isPurchased && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
            >Cancelar Compra</button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >Fechar</button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-40 text-sm font-semibold"
          >Confirmar Compra</button>
        </div>
      </div>
    </div>
  )
}
