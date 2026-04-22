// Formata valor em BRL
export const formatarBRL = (v) =>
  'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

// Alias
export const fmtBRL = formatarBRL

// Normaliza valor digitado (aceita virgula e ponto)
export const parseValor = (s) => {
  if (!s && s !== 0) return null
  const str = String(s).replace(/[^\d,\.]/g, '')
  if (str.includes(',')) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'))
  }
  return parseFloat(str)
}

// Retorna menor preco, maior preco e indice do menor entre um array de strings/numeros
export const getPrecoPecas = (precos) => {
  const nums = precos.map(p => parseFloat(String(p || '').replace(',', '.')) || 0)
  const validos = nums.filter(n => n > 0)
  if (validos.length === 0) return { melhor: null, pior: null, melhorIdx: -1 }
  const melhor = Math.min(...validos)
  const pior = Math.max(...validos)
  const melhorIdx = nums.indexOf(melhor)
  return { melhor, pior, melhorIdx }
}

// Calcula resumo financeiro de um evento
export const calcularResumoEvento = (evento) => {
  const parts = evento?.parts || []

  let totalComprado = 0
  let totalMelhorPreco = 0
  let pecasCompradas = 0

  parts.forEach(p => {
    const precos = Object.values(p.prices || {}).map(v => parseFloat(String(v).replace(',', '.')) || 0).filter(v => v > 0)
    if (precos.length > 0) {
      totalMelhorPreco += Math.min(...precos) * (p.quantity || 1)
    }
    if (p.selectedStore) {
      const preco = parseFloat(String(p.prices?.[p.selectedStore] || '').replace(',', '.')) || 0
      totalComprado += preco * (p.quantity || 1)
      if (preco > 0) pecasCompradas++
    }
  })

  return {
    totalPecas: parts.length,
    pecasCompradas,
    totalComprado,
    totalMelhorPreco,
    economia: totalComprado - totalMelhorPreco
  }
}

// Alias
export const calcularResumo = calcularResumoEvento

// Gera relatorio de fechamento agrupado por loja
export const gerarRelatorioFechamento = ({ parts = [], stores = [] }) => {
  const porLoja = {}

  parts.forEach(p => {
    if (!p.selectedStore) return
    const loja = stores.find(l => l.id === p.selectedStore)
    if (!loja) return
    const preco = parseFloat(String(p.prices?.[p.selectedStore] || '').replace(',', '.')) || 0
    if (!porLoja[loja.id]) {
      porLoja[loja.id] = { nome: loja.nome, itens: [], subtotal: 0 }
    }
    porLoja[loja.id].itens.push({
      peca: p.name,
      quantidade: p.quantity || 1,
      valor: preco * (p.quantity || 1),
      formaPagamento: p.paymentType || 'dinheiro'
    })
    porLoja[loja.id].subtotal += preco * (p.quantity || 1)
  })

  return porLoja
}

// Parser de texto colado (planilha)
export const parsearTextoColado = (texto) => {
  if (!texto.trim()) return { parts: [], stores: [] }

  const linhas = texto.trim().split('\n').filter(l => l.trim())
  if (linhas.length < 2) return { parts: [], stores: [] }

  // Detectar separador
  const primeiraLinha = linhas[0]
  let sep = '\t'
  if (!primeiraLinha.includes('\t')) {
    if (primeiraLinha.includes(';')) sep = ';'
    else if (primeiraLinha.includes(',')) sep = ','
    else sep = /\s{2,}/
  }

  const splitLinha = (l) => sep instanceof RegExp ? l.split(sep) : l.split(sep)

  const cabecalho = splitLinha(linhas[0]).map(c => c.trim())
  const stores = cabecalho.slice(1).filter(Boolean)

  const parts = []
  for (let i = 1; i < linhas.length; i++) {
    const cols = splitLinha(linhas[i]).map(c => c.trim())
    if (!cols[0]) continue
    const peca = { name: cols[0], quantity: 1, unit: 'un', prices: {} }
    stores.forEach((loja, idx) => {
      const val = cols[idx + 1]
      if (val) {
        const num = parseFloat(String(val).replace(',', '.').replace(/[^\d.]/g, ''))
        if (!isNaN(num) && num > 0) peca.prices[loja] = String(num)
      }
    })
    parts.push(peca)
  }

  return { parts, stores }
}
