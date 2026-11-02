import type { TaxSchedule, TaxType } from './types'
import { addYears, todayDateOnly } from './dates'

export function yearsForTaxType(taxType: TaxType): number {
  return taxType === 'pajak_tahunan' ? 1 : 5
}

export function computeNextDueFromPayment(
  paidDate: string,
  taxType: TaxType,
): string {
  return addYears(paidDate, yearsForTaxType(taxType))
}

/** Apply "mark paid today" with optional manual next due override. */
export function markTaxPaid(
  schedule: TaxSchedule,
  paidDate: string = todayDateOnly(),
  nextDueOverride?: string | null,
): TaxSchedule {
  const computed = computeNextDueFromPayment(paidDate, schedule.taxType)
  return {
    ...schedule,
    lastPaidDate: paidDate,
    nextDueDate: nextDueOverride ?? computed,
    paidForCurrentPeriod: true,
  }
}

export function createDefaultTaxSchedules(
  vehicleId: string,
  remindDaysBefore: number,
): Omit<TaxSchedule, 'id'>[] {
  const types: TaxType[] = ['pajak_tahunan', 'pajak_5_tahun']
  return types.map((taxType) => ({
    vehicleId,
    taxType,
    lastPaidDate: null,
    nextDueDate: null,
    remindDaysBefore,
    paidForCurrentPeriod: false,
  }))
}
