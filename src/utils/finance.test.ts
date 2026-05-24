import { describe, it, expect } from 'vitest'
import {
  calculateTotalIncome,
  calculateMaaserRequired,
  calculateAdjustedMaaserRequirement,
  computeReportCalculations,
} from './finance'

describe('finance calculations', () => {
  it('calculates total income', () => {
    expect(
      calculateTotalIncome(100000, 50000, [{ id: '1', description: 'בונוס', amount: 25000 }]),
    ).toBe(175000)
  })

  it('calculates maaser at 10%', () => {
    expect(calculateMaaserRequired(175000)).toBe(17500)
  })

  it('applies debt before credit when credit disabled', () => {
    expect(calculateAdjustedMaaserRequirement(270000, 160000, 50000, false)).toBe(430000)
  })

  it('reduces requirement by credit when enabled', () => {
    expect(calculateAdjustedMaaserRequirement(270000, 160000, 50000, true)).toBe(380000)
  })

  it('never allows negative adjusted requirement', () => {
    expect(calculateAdjustedMaaserRequirement(10000, 0, 50000, true)).toBe(0)
  })

  it('computes full report with remaining debt', () => {
    const result = computeReportCalculations({
      salaryHusband: 1500000,
      salaryWife: 1200000,
      additionalIncome: [],
      fixedDonationSnapshots: [
        { donationId: '1', name: 'ישיבה', amount: 50000 },
      ],
      oneTimeDonations: [{ id: '1', description: 'צדקה', amount: 50000, receiptUrl: null, donatedAt: '2025-05-01' }],
      openingDebt: 160000,
      openingCredit: 0,
      creditCarryForwardEnabled: false,
    })
    expect(result.maaserRequired).toBe(270000)
    expect(result.adjustedMaaserRequirement).toBe(430000)
    expect(result.remainingBalance).toBe(330000)
    expect(result.closingDebt).toBe(330000)
  })
})
