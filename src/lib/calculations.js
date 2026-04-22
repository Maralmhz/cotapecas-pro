// Formata valor em BRL
export const fmtBRL = (v) =>
  'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

// Normaliza valor digitado (aceita virgula e ponto)
export const parseValor = (s) => {
  if (!s && s !== 0) return null
  const str = String(s).replace(/[^\d,\.]/g, '')
  // Se tem virgula como decimal: 1.234,56 ou 1234,56
  if (str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'))
  }
  return parseFloat(str)
}

// Calcula resumo financeiro de um evento
export const calcularResumo = (event) => {
  const { parts = [], stores = [], servicos = [] } = event

  let totalIni = 0
  let totalFin = 0

  parts.forEach(p => {
    const prices = stores.map((_, si) => parseValor(p.prices?.[si])).filter(v => v > 0)
    if (prices.length) totalIni += Math.max(...prices)
    if (p.selectedStore !== null && p.selectedStore !== undefined && p.selectedStore !== '') {
      const v = parseValor(p.prices?.[p.selectedStore])
      if (v) totalFin += v
    }
  })

  const ecoPartes = totalIni - totalFin
  const ecoPctPartes = totalIni > 0 ? (ecoPartes / totalIni) * 100 : 0

  let moIni = 0, moFin = 0
  servicos.forEach(s => {
    moIni += parseValor(s.valor_inicial) || 0
    moFin += parseValor(s.valor_final) || 0
  })

  const ecoMO = moIni - moFin
  const ecoPctMO = moIni > 0 ? (ecoMO / moIni) * 100 : 0

  const evtIni = totalIni + moIni
  const evtFin = totalFin + (moFin || moIni)
  const ecoEvt = evtIni - evtFin
  const ecoPctEvt = evtIni > 0 ? (ecoEvt / evtIni) * 100 : 0

  return {
    totalPecasIni: totalIni,
    totalPecasFin: totalFin,
    ecoPecas: ecoPartes,
    ecoPctPecas: ecoPctPartes,
    totalMOIni: moIni,
    totalMOFin: moFin,
    ecoMO,
    ecoPctMO,
    totalEventoIni: evtIni,
    totalEventoFin: evtFin,
    ecoEvento: ecoEvt,
    ecoPctEvento: ecoPctEvt
  }
}

// Retorna melhor e pior preco de uma peca
export const getPrecoPecas = (prices = []) => {
  const validos = prices.map(v => parseValor(v)).filter(v => v > 0)
  if (!validos.length) return { melhor: null, pior: null, melhorIdx: -1, piorIdx: -1 }
  const melhor = Math.min(...validos)
  const pior = Math.max(...validos)
  const melhorIdx = prices.findIndex(v => parseValor(v) === melhor)
  const piorIdx = prices.findIndex(v => parseValor(v) === pior)
  return { melhor, pior, melhorIdx, piorIdx }
}

// Gera relatório agrupado por loja para fechamento
export const gerarRelatorioFechamento = (event) => {
  const { parts = [], stores = [] } = event
  const porLoja = {}

  parts.forEach(p => {
    if (p.selectedStore === null || p.selectedStore === undefined || p.selectedStore === '') return
    const lojaNome = stores[p.selectedStore] || 'Loja desconhecida'
    const valor = parseValor(p.prices?.[p.selectedStore]) || 0
    if (!porLoja[lojaNome]) porLoja[lojaNome] = { nome: lojaNome, itens: [], subtotal: 0 }
    porLoja[lojaNome].itens.push({
      peca: p.name,
      valor,
      formaPagamento: p.paymentType || 'comprado'
    })
    porLoja[lojaNome].subtotal += valor
  })

  return Object.values(porLoja).sort((a, b) => b.subtotal - a.subtotal)
}
