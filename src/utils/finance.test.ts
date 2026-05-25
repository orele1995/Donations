import { describe, it, expect } from 'vitest'
import {
  calculateTotalIncome,
  calculateMaaserRequired,
  calculateAdjustedMaaserRequirement,
  computeReportCalculations,
  getAppliedCredit,
} from './finance'

describe('finance calculations', () => {
  it('calculates total income from members and additional', () => {
    expect(
      calculateTotalIncome(
        [
          { memberId: '1', memberName: 'א', amount: 100000 },
          { memberId: '2', memberName: 'ב', amount: 50000 },
        ],
        [{ id: '1', description: 'בונוס', amount: 25000 }],
      ),
    ).toBe(175000)
  })

  it('calculates maaser at 10%', () => {
    expect(calculateMaaserRequired(175000)).toBe(17500)
  })

  it('always applies debt', () => {
    expect(calculateAdjustedMaaserRequirement(270000, 160000, 0)).toBe(430000)
  })

  it('applies credit only when user opts in', () => {
    expect(getAppliedCredit(false, 50000)).toBe(0)
    expect(getAppliedCredit(true, 50000)).toBe(50000)
    expect(calculateAdjustedMaaserRequirement(270000, 160000, 50000)).toBe(380000)
  })

  it('computes full report with remaining debt', () => {
    const result = computeReportCalculations({
      memberIncomes: [
        { memberId: '1', memberName: 'א', amount: 1500000 },
        { memberId: '2', memberName: 'ב', amount: 1200000 },
      ],
      additionalIncome: [],
      fixedDonationSnapshots: [{ donationId: '1', name: 'ישיבה', amount: 50000 }],
      oneTimeDonations: [
        {
          id: '1',
          description: 'צדקה',
          amount: 50000,
          receiptUrl: null,
          donatedAt: '2025-05-01',
        },
      ],
      openingDebt: 160000,
      applyCreditFromPrevious: false,
      creditFromPreviousMonth: 30000,
    })
    expect(result.maaserRequired).toBe(270000)
    expect(result.adjustedMaaserRequirement).toBe(430000)
    expect(result.remainingBalance).toBe(330000)
    expect(result.closingDebt).toBe(330000)
    expect(result.maaserPaidTotal).toBe(100000)
  })
})
