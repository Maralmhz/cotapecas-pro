import { useRef, useState } from 'react'

export default function Settings({ settings, onChange, onSave, onReset }) {
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  const handleSave = () => {
    onSave?.()
    setMessage('Salvo com sucesso')
    setTimeout(() => setMessage(''), 2000)
  }

  const handleLogoUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange('companyLogo', ev.target?.result || '')
    reader.readAsDataURL(file)
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-3 space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500">Personalize sua experiência no CotaPeças Pro</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Configurações do usuário">
          <Field label="Nome da empresa">
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => onChange('companyName', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Ex.: Oficina Silva"
            />
          </Field>
          <Field label="Nome do usuário">
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => onChange('userName', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Ex.: João"
            />
          </Field>
          <Field label="Logo (URL)">
            <input
              type="url"
              value={settings.companyLogo}
              onChange={(e) => onChange('companyLogo', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </Field>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Upload logo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
            className="hidden"
          />
        </Panel>

        <Panel title="Configurações do sistema">
          <Field label="Tema">
            <select
              value={settings.theme}
              onChange={(e) => onChange('theme', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="claro">Claro</option>
              <option value="escuro">Escuro</option>
            </select>
          </Field>
          <Field label="Moeda">
            <select
              value={settings.currency}
              onChange={(e) => onChange('currency', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Toggle
            label="Mostrar valores zerados"
            checked={settings.showZeroValues}
            onChange={(value) => onChange('showZeroValues', value)}
          />
        </Panel>

        <Panel title="Configurações de cotação" className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle
              label="Mostrar ECON%"
              checked={settings.showEconomyPercent}
              onChange={(value) => onChange('showEconomyPercent', value)}
            />
            <Toggle
              label="Mostrar CÓD"
              checked={settings.showCodeColumn}
              onChange={(value) => onChange('showCodeColumn', value)}
            />
            <Toggle
              label="Mostrar QTD"
              checked={settings.showQuantityColumn}
              onChange={(value) => onChange('showQuantityColumn', value)}
            />
          </div>
        </Panel>
      </div>

      <div className="sticky bottom-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
        <div className="text-xs text-emerald-600 font-medium">{message}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          >
            Resetar configurações
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </section>
  )
}

function Panel({ title, children, className = '' }) {
  return (
    <div className={`border border-slate-200 rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition relative ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-0'}`} style={{ left: '2px' }} />
      </button>
    </label>
  )
}
