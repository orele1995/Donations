import { describe, it, expect } from 'vitest'
import { getMonthlyFinancialSummary } from './monthly-summary'

describe('getMonthlyFinancialSummary', () => {
  it('debt: positive remaining', () => {
    const s = getMonthlyFinancialSummary(9000)
    expect(s.status).toBe('debt')
    expect(s.amountDueAgorot).toBe(9000)
    expect(s.chartBalanceShekels).toBe(-90)
  })

  it('credit: negative remaining', () => {
    const s = getMonthlyFinancialSummary(-9000)
    expect(s.status).toBe('credit')
    expect(s.amountDueAgorot).toBe(0)
    expect(s.chartBalanceShekels).toBe(90)
  })

  it('balanced: zero', () => {
    const s = getMonthlyFinancialSummary(0)
    expect(s.status).toBe('balanced')
    expect(s.chartBalanceShekels).toBe(0)
  })
})
