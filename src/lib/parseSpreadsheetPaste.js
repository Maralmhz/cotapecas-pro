const COLOR_STATUS_MAP = [
  { name: 'green', paymentMethod: 'dinheiro', isPurchased: true, matcher: (rgb) => rgb.g > 140 && rgb.r < 170 && rgb.b < 140 },
  { name: 'orange', paymentMethod: 'boleto', isPurchased: true, matcher: (rgb) => rgb.r > 190 && rgb.g > 120 && rgb.g < 220 && rgb.b < 120 },
  { name: 'yellow', paymentMethod: 'cartao', isPurchased: true, matcher: (rgb) => rgb.r > 200 && rgb.g > 190 && rgb.b < 120 },
  { name: 'red', paymentMethod: 'cancelado', isPurchased: false, matcher: (rgb) => rgb.r > 180 && rgb.g < 110 && rgb.b < 110 },
  { name: 'blue', paymentMethod: 'outros', isPurchased: true, matcher: (rgb) => rgb.b > 140 && rgb.r < 130 && rgb.g < 170 },
]

const toNumber = (value = '') => {
  const cleaned = String(value).replace(/R\$/gi, '').replace(/\s/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  const n = parseFloat(normalized.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

const parseRgb = (style = '') => {
  const rgbMatch = style.match(/background(?:-color)?\s*:\s*rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i)
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) }
  }

  const hexMatch = style.match(/background(?:-color)?\s*:\s*#([0-9a-f]{6})/i)
  if (hexMatch) {
    const hex = hexMatch[1]
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }

  return null
}

const getColorStatus = (style = '') => {
  const rgb = parseRgb(style)
  if (!rgb) return null
  const matched = COLOR_STATUS_MAP.find((entry) => entry.matcher(rgb))
  if (!matched) return null
  return { paymentMethod: matched.paymentMethod, isPurchased: matched.isPurchased }
}

const getTableMatrix = (table) => {
  const rows = [...table.querySelectorAll('tr')]
  return rows.map((row) => [...row.querySelectorAll('th,td')].map((cell) => ({
    text: cell.textContent?.trim() || '',
    style: cell.getAttribute('style') || '',
  })))
}

const findHeaderRowIndex = (matrix) => matrix.findIndex((row) => row.some((c) => /pe[cç]as/i.test(c.text)))

export const parseSpreadsheetHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const table = doc.querySelector('table')
  if (!table) return null

  const matrix = getTableMatrix(table)
  const headerRowIndex = findHeaderRowIndex(matrix)
  if (headerRowIndex < 0) return null

  const headerRow = matrix[headerRowIndex]
  const pecaCol = headerRow.findIndex((c) => /pe[cç]as/i.test(c.text))
  const melhorCol = headerRow.findIndex((c) => /melhor/i.test(c.text))
  const lojaCol = headerRow.findIndex((c) => /^loja$/i.test(c.text))
  if (pecaCol < 0) return null

  const stopCol = [melhorCol, lojaCol].filter((idx) => idx > pecaCol).sort((a, b) => a - b)[0] ?? headerRow.length
  const shopColumns = []
  for (let ci = pecaCol + 1; ci < stopCol; ci += 1) {
    const name = headerRow[ci]?.text?.trim()
    if (name) shopColumns.push({ index: ci, name })
  }

  const parts = []
  const priceFlags = {}

  for (let ri = headerRowIndex + 1; ri < matrix.length; ri += 1) {
    const row = matrix[ri]
    const partName = row[pecaCol]?.text?.trim()
    if (!partName) continue
    if (/^total\b/i.test(partName) || /legenda/i.test(partName)) break

    const partId = Date.now() + ri
    const part = { id: partId, name: partName, code: '', quantity: '', obs: '' }
    let hasPrice = false

    shopColumns.forEach((shop) => {
      const cell = row[shop.index]
      if (!cell) return
      const num = toNumber(cell.text)
      if (!num) return
      hasPrice = true
      const key = `${partId}_${shop.name}`
      priceFlags[key] = {
        price: num,
        ...(getColorStatus(cell.style) || {}),
      }
    })

    if (hasPrice) parts.push(part)
  }

  if (parts.length === 0 || shopColumns.length === 0) return null

  const descriptionLine = matrix.flat().find((cell) => /descri[cç][aã]o/i.test(cell.text))?.text || ''
  const title = descriptionLine.replace(/.*descri[cç][aã]o\s*:?/i, '').trim()

  return {
    title,
    shops: shopColumns.map((shop, idx) => ({ id: `shop_${idx}_${shop.name}`, name: shop.name })),
    parts,
    pricesByShopName: priceFlags,
  }
}

export const parseSpreadsheetTextGrid = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 3) return null
  const sep = lines[0].includes('\t') ? '\t' : ';'
  const rows = lines.map((line) => line.split(sep).map((cell) => cell.trim()))

  const headerRowIndex = rows.findIndex((row) => row.some((c) => /pe[cç]as/i.test(c)))
  if (headerRowIndex < 0) return null

  const header = rows[headerRowIndex]
  const pecaCol = header.findIndex((c) => /pe[cç]as/i.test(c))
  const melhorCol = header.findIndex((c) => /melhor/i.test(c))
  const stopCol = melhorCol > pecaCol ? melhorCol : header.length

  const shops = []
  for (let ci = pecaCol + 1; ci < stopCol; ci += 1) {
    if (header[ci]) shops.push({ id: `shop_${ci}_${header[ci]}`, name: header[ci] })
  }

  const parts = []
  const pricesByShopName = {}

  for (let ri = headerRowIndex + 1; ri < rows.length; ri += 1) {
    const row = rows[ri]
    const partName = row[pecaCol]
    if (!partName || /^total\b/i.test(partName) || /legenda/i.test(partName)) break
    const partId = Date.now() + ri
    const part = { id: partId, name: partName, code: '', quantity: '', obs: '' }
    let hasPrice = false

    shops.forEach((shop, idx) => {
      const value = row[pecaCol + 1 + idx]
      const num = toNumber(value)
      if (!num) return
      hasPrice = true
      pricesByShopName[`${partId}_${shop.name}`] = { price: num }
    })

    if (hasPrice) parts.push(part)
  }

  if (!parts.length || !shops.length) return null
  return { title: '', shops, parts, pricesByShopName }
}
