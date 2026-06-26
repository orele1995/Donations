/** All monetary values stored as agorot (1/100 shekel) */
export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100)
}

export function agorotToShekels(agorot: number): number {
  return agorot / 100
}

export function formatShekels(agorot: number): string {
  const shekels = agorotToShekels(agorot)
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(shekels)
  return `₪ ${formatted}`
}

export function parseShekelInput(value: string): number {
  const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  if (Number.isNaN(parsed)) return 0
  return shekelsToAgorot(parsed)
}

export function shekelInputFromAgorot(agorot: number): string {
  if (agorot === 0) return ''
  const shekels = agorotToShekels(agorot)
  return shekels % 1 === 0 ? String(shekels) : shekels.toFixed(2)
}
