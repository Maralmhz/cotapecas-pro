const VEHICLE_PATTERN = /\b(20[0-9]{2}|19[89][0-9])\b|\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b|\b[A-Z0-9]{17}\b/i

const toLines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)

const normalizeLabel = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(esq|esquerda)\b/g, 'esquerdo')
    .replace(/\b(dir|direita)\b/g, 'direito')
    .replace(/\btraseira?\b/g, 'traseiro')
    .replace(/\bdianteira?\b/g, 'dianteiro')
    .trim()

const parseMoney = (raw) => Number(raw.replace(/\./g, '').replace(',', '.'))

export function parseVehicle(text) {
  const lines = toLines(text)
  for (const line of lines) {
    if (/^pe[cç]as?$/i.test(line)) continue
    const storeMatch = line.match(/^([^:]+):\s*(.+)$/)
    const candidate = storeMatch ? storeMatch[2] : line
    if (candidate && VEHICLE_PATTERN.test(candidate)) {
      return candidate.trim()
    }
  }
  return ''
}

export function parseParts(text) {
  const lines = toLines(text)
  const parts = []
  let afterPartsHeader = false

  for (const line of lines) {
    if (/^pe[cç]as?$/i.test(line)) {
      afterPartsHeader = true
      continue
    }

    if (!afterPartsHeader && VEHICLE_PATTERN.test(line)) continue
    if (!afterPartsHeader && /^[^:]+:\s*.+$/i.test(line)) continue
    if (!line) continue

    const baseName = line.split(/\s*-\s*/)[0].trim()
    if (!baseName) continue
    parts.push(baseName)
  }

  return [...new Set(parts)]
}

export function parsePrices(text) {
  const lines = toLines(text)
  if (lines.length === 0) return { storeName: '', items: [] }

  const firstLineMatch = lines[0].match(/^([^:]{2,}):\s*(.+)?$/)
  const storeName = firstLineMatch ? firstLineMatch[1].trim() : ''

  const items = []
  for (const line of lines) {
    if (/^pe[cç]as?$/i.test(line)) continue
    if (line === lines[0] && firstLineMatch) continue

    const partName = line.split(/\s*-\s*/)[0].trim()
    if (!partName) continue

    if (/\bnt\b/i.test(line) && !/(\d+[.,]\d{2})/.test(line)) continue

    const numbers = [...line.matchAll(/(\d+[.,]\d{2})/g)].map((match) => parseMoney(match[1]))
    if (numbers.length === 0) continue

    items.push({
      name: partName,
      normalizedName: normalizeLabel(partName),
      price: Math.min(...numbers),
    })
  }

  return { storeName, items }
}

export function normalizePartName(value) {
  return normalizeLabel(value)
}
