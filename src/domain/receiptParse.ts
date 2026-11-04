import type { VehicleCategory } from './types'
import type { MaintenanceType } from './types'
import { formatDateOnly, todayDateOnly } from './dates'
import { getPartsForCategory } from './partsCatalog'

export interface ParsedReceipt {
  type: MaintenanceType
  serviceDate: string
  odometerKm: number
  title: string
  details: string
  costIdr?: number
  partId?: string
  rawText: string
}

const MONTH_ID: Record<string, number> = {
  jan: 1,
  january: 1,
  januari: 1,
  feb: 2,
  februari: 2,
  mar: 3,
  maret: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  jul: 7,
  juli: 7,
  aug: 8,
  agu: 8,
  agustus: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oct: 10,
  oktober: 10,
  october: 10,
  nov: 11,
  november: 11,
  des: 12,
  dec: 12,
  desember: 12,
  december: 12,
}

function normalizeText(text: string): string {
  return text.replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function parseNumericToken(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d]/g, '')
  if (!cleaned) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function parseMoneyAmounts(text: string): number[] {
  const amounts: number[] = []
  const patterns = [
    /(?:Rp\.?|IDR)\s*([\d.,\s]+)/gi,
    /(?:total|grand\s*total|jumlah|bayar|tagihan)\s*[:\-]?\s*(?:Rp\.?)?\s*([\d.,\s]+)/gi,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const n = parseNumericToken(match[1])
      if (n !== undefined && n >= 1000 && n <= 500_000_000) {
        amounts.push(n)
      }
    }
  }
  return amounts
}

function pickTotalCost(text: string): number | undefined {
  const upper = text.toUpperCase()
  const totalLine = upper.match(
    /(?:GRAND\s*)?TOTAL[^\d]*([\d.,\s]{4,})/,
  )
  if (totalLine) {
    const n = parseNumericToken(totalLine[1])
    if (n !== undefined) return n
  }
  const amounts = parseMoneyAmounts(text)
  if (amounts.length === 0) return undefined
  return Math.max(...amounts)
}

function parseServiceDate(text: string): string | undefined {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  for (const match of text.matchAll(
    /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
  )) {
    let d = Number(match[1])
    let m = Number(match[2])
    let y = Number(match[3])
    if (y < 100) y += 2000
    if (m > 12 && d <= 12) [d, m] = [m, d]
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return formatDateOnly(new Date(y, m - 1, d))
    }
  }

  for (const match of text.matchAll(
    /\b(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})\b/g,
  )) {
    const d = Number(match[1])
    const monthKey = match[2].toLowerCase()
    const y = Number(match[3])
    const m = MONTH_ID[monthKey]
    if (m && d >= 1 && d <= 31) {
      return formatDateOnly(new Date(y, m - 1, d))
    }
  }

  return undefined
}

function parseOdometerKm(text: string): number | undefined {
  const patterns = [
    /(?:km|odometer|odo|kilometer)[\s:]*([\d.\s,]{3,})/gi,
    /\b([\d]{1,3}[.\s]\d{3})\s*km\b/gi,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const n = parseNumericToken(match[1])
      if (n !== undefined && n >= 100 && n <= 2_000_000) return n
    }
  }
  return undefined
}

function inferMaintenanceType(text: string): MaintenanceType {
  const t = text.toLowerCase()
  if (/\b(ganti\s*)?oli\b|\boil\b|pelumas|engine\s*oil/.test(t)) {
    return 'oil_change'
  }
  if (
    /\bfilter\b|kampas|ban|rem|brake|aki|battery|busi|spark|radiator|coolant|transmisi|chain|rantai|spare\s*part|part\b|service/.test(
      t,
    )
  ) {
    return 'part_replacement'
  }
  return 'other'
}

function inferTitle(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const trimmed = line.trim()
    if (trimmed.length < 4) continue
    if (/^\d+$/.test(trimmed.replace(/\s/g, ''))) continue
    if (/^(tgl|tanggal|date|no\.?\s*nota|invoice|telp|phone)/i.test(trimmed)) {
      continue
    }
    return trimmed.slice(0, 80)
  }
  return 'Servis bengkel'
}

function matchPartId(
  text: string,
  category: VehicleCategory,
): string | undefined {
  const lower = text.toLowerCase()
  const parts = getPartsForCategory(category)
  for (const part of parts) {
    const label = part.label.toLowerCase()
    if (lower.includes(label)) return part.id
    if (part.id.includes('engine_oil') && /\boli\b/.test(lower)) return part.id
    if (part.id.includes('tires') && /\bban\b/.test(lower)) return part.id
    if (part.id.includes('brake') && /\brem\b/.test(lower)) return part.id
    if (part.id.includes('battery') && /\baki\b/.test(lower)) return part.id
    if (part.id.includes('chain') && /\brantai\b/.test(lower)) return part.id
    if (part.id.includes('air_filter') && /\bfilter\s*udara\b/.test(lower)) {
      return part.id
    }
  }
  return undefined
}

export function parseReceiptText(
  rawText: string,
  options: {
    defaultOdometerKm: number
    category: VehicleCategory
    lockedType?: MaintenanceType
    lockedPartId?: string
  },
): ParsedReceipt {
  const text = normalizeText(rawText)
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const type = options.lockedType ?? inferMaintenanceType(text)
  const serviceDate = parseServiceDate(text) ?? todayDateOnly()
  const odometerKm =
    parseOdometerKm(text) ?? options.defaultOdometerKm
  const costIdr = pickTotalCost(text)
  const partId =
    options.lockedPartId ?? matchPartId(text, options.category)
  const title =
    type === 'oil_change' && !lines.some((l) => /oli/i.test(l))
      ? 'Ganti oli'
      : inferTitle(lines)

  const details =
    text.length > 600 ? `${text.slice(0, 597)}…` : text

  return {
    type,
    serviceDate,
    odometerKm,
    title,
    details,
    costIdr,
    partId,
    rawText: text,
  }
}
