import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Download, Save } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import {
  useFixedDonations,
  useReport,
  useMembers,
  useInvalidateHousehold,
} from '@/hooks/use-household-data'
import { computeReportCalculations, getAppliedCredit } from '@/utils/finance'
import {
  buildFixedSnapshots,
  buildDefaultMemberIncomes,
  getOpeningBalances,
} from '@/services/reports.service'
import { db } from '@/lib/firebase'
import * as reportsService from '@/services/reports.service'
import type {
  AdditionalIncomeEntry,
  MemberIncomeEntry,
  MonthlyReport,
  OneTimeDonation,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyInput } from '@/components/shared/money-input'
import { ReportCalculationsPanel } from '@/features/reports/report-calculations-panel'
import { exportReportToExcel } from '@/utils/export'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import { formatMonthLabel } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'
import { useQueryClient } from '@tanstack/react-query'

interface ReportEditorProps {
  year: number
  month: number
  isNew: boolean
}

export function ReportEditor({ year, month, isNew }: ReportEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()
  const { data: existing } = useReport(year, month, !isNew)
  const { data: members } = useMembers()
  const { data: fixedDonations } = useFixedDonations()
  const invalidate = useInvalidateHousehold()

  const householdId = profile?.activeHouseholdId ?? ''
  const userId = user?.uid ?? ''
  const userName = user?.displayName ?? profile?.displayName ?? ''

  const [memberIncomes, setMemberIncomes] = useState<MemberIncomeEntry[]>([])
  const [additionalIncome, setAdditionalIncome] = useState<AdditionalIncomeEntry[]>([])
  const [oneTimeDonations, setOneTimeDonations] = useState<OneTimeDonation[]>([])
  const [openingDebt, setOpeningDebt] = useState(0)
  const [creditFromPreviousMonth, setCreditFromPreviousMonth] = useState(0)
  const [applyCreditFromPrevious, setApplyCreditFromPrevious] = useState(false)
  const [fixedSnapshots, setFixedSnapshots] = useState<MonthlyReport['fixedDonationSnapshots']>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized || !members) return

    const init = async (): Promise<void> => {
      if (existing) {
        setMemberIncomes(
          buildDefaultMemberIncomes(members, existing.memberIncomes),
        )
        setAdditionalIncome(existing.additionalIncome)
        setOneTimeDonations(existing.oneTimeDonations)
        setOpeningDebt(existing.openingDebt)
        setCreditFromPreviousMonth(existing.creditFromPreviousMonth)
        setApplyCreditFromPrevious(existing.applyCreditFromPrevious)
        setFixedSnapshots(existing.fixedDonationSnapshots)
        setInitialized(true)
        return
      }

      if (isNew && fixedDonations && db && householdId) {
        const snapshots = buildFixedSnapshots(fixedDonations, year, month)
        setFixedSnapshots(snapshots)

        const balances = await getOpeningBalances(db, householdId, year, month)
        setMemberIncomes(buildDefaultMemberIncomes(members, balances.prevMemberIncomes))
        setOpeningDebt(balances.openingDebt)
        setCreditFromPreviousMonth(balances.creditFromPreviousMonth)
        setApplyCreditFromPrevious(false)
      }
      setInitialized(true)
    }

    void init()
  }, [
    existing,
    isNew,
    fixedDonations,
    year,
    month,
    householdId,
    members,
    initialized,
  ])

  useEffect(() => {
    if (!initialized || !fixedDonations) return
    setFixedSnapshots(buildFixedSnapshots(fixedDonations, year, month))
  }, [fixedDonations, year, month, initialized])

  const calculations = useMemo(
    () =>
      computeReportCalculations({
        memberIncomes,
        additionalIncome,
        fixedDonationSnapshots: fixedSnapshots,
        oneTimeDonations,
        openingDebt,
        applyCreditFromPrevious,
        creditFromPreviousMonth,
      }),
    [
      memberIncomes,
      additionalIncome,
      fixedSnapshots,
      oneTimeDonations,
      openingDebt,
      applyCreditFromPrevious,
      creditFromPreviousMonth,
    ],
  )

  const appliedCredit = getAppliedCredit(
    applyCreditFromPrevious,
    creditFromPreviousMonth,
  )

  const buildDraft = useCallback((): MonthlyReport => {
    const now = new Date().toISOString()
    return {
      id: existing?.id ?? '',
      householdId,
      year,
      month,
      memberIncomes,
      additionalIncome,
      oneTimeDonations,
      fixedDonationSnapshots: fixedSnapshots,
      applyCreditFromPrevious,
      creditFromPreviousMonth,
      openingDebt,
      openingCredit: appliedCredit,
      ...calculations,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      createdBy: existing?.createdBy ?? userId,
      updatedBy: userId,
    }
  }, [
    existing,
    householdId,
    year,
    month,
    memberIncomes,
    additionalIncome,
    oneTimeDonations,
    fixedSnapshots,
    applyCreditFromPrevious,
    creditFromPreviousMonth,
    openingDebt,
    appliedCredit,
    calculations,
    userId,
  ])

  const handleSave = async (): Promise<void> => {
    if (!householdId || !db) return
    setSaving(true)
    try {
      const draft = buildDraft()
      const saved = await reportsService.saveReport(
        db,
        draft,
        userId,
        userName,
        isNew && !existing,
        existing ? (existing as unknown as Record<string, unknown>) : null,
      )
      queryClient.setQueryData(['report', householdId, year, month], saved)
      setDirty(false)
      invalidate()
      toast({ title: labels.saved })
      if (isNew) {
        navigate(`/reports/${year}/${month}`, { replace: true })
      }
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const markDirty = (): void => setDirty(true)

  const updateMemberIncome = (memberId: string, amount: number): void => {
    setMemberIncomes((prev) =>
      prev.map((e) => (e.memberId === memberId ? { ...e, amount } : e)),
    )
    markDirty()
  }

  const addAdditionalIncome = (): void => {
    setAdditionalIncome((prev) => [
      ...prev,
      { id: generateId(), description: '', amount: 0 },
    ])
    markDirty()
  }

  const addOneTime = (): void => {
    setOneTimeDonations((prev) => [
      ...prev,
      {
        id: generateId(),
        description: '',
        amount: 0,
        receiptUrl: null,
        donatedAt: new Date().toISOString().slice(0, 10),
      },
    ])
    markDirty()
  }

  if (!initialized || !members) {
    return <div className="py-12 text-center text-[var(--color-muted-foreground)]">{labels.loading}</div>
  }

  const draft = buildDraft()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? labels.newReport : labels.edit} — {formatMonthLabel(year, month)}
          </h1>
          {dirty && (
            <p className="mt-1 text-sm text-amber-600">{labels.unsavedChanges}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? labels.loading : labels.save}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToExcel(draft)}
          >
            <Download className="h-4 w-4" />
            {labels.exportExcel}
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            {labels.cancel}
          </Button>
        </div>
      </div>

      {creditFromPreviousMonth > 0 && (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium text-violet-900">{labels.creditFromPreviousMonth}</p>
              <p className="text-sm text-violet-700">
                {formatShekels(creditFromPreviousMonth)} — {labels.applyCreditHint}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={applyCreditFromPrevious}
                onChange={(e) => {
                  setApplyCreditFromPrevious(e.target.checked)
                  markDirty()
                }}
                className="h-4 w-4 rounded border-violet-300 text-indigo-600 focus:ring-indigo-400"
              />
              <span className="text-sm font-medium">{labels.applyCreditFromPrevious}</span>
            </label>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{labels.income}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {memberIncomes.map((entry) => (
                <MoneyInput
                  key={entry.memberId}
                  label={entry.memberName}
                  valueAgorot={entry.amount}
                  onChangeAgorot={(v) => updateMemberIncome(entry.memberId, v)}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{labels.additionalIncome}</CardTitle>
              <Button size="sm" variant="outline" onClick={addAdditionalIncome}>
                <Plus className="h-4 w-4" />
                {labels.addEntry}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {additionalIncome.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noData}</p>
              )}
              {additionalIncome.map((entry, i) => (
                <div key={entry.id} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      placeholder={labels.description}
                      value={entry.description}
                      onChange={(e) => {
                        const next = [...additionalIncome]
                        next[i] = { ...entry, description: e.target.value }
                        setAdditionalIncome(next)
                        markDirty()
                      }}
                    />
                  </div>
                  <div className="w-32 shrink-0">
                    <MoneyInput
                      label=""
                      valueAgorot={entry.amount}
                      onChangeAgorot={(v) => {
                        const next = [...additionalIncome]
                        next[i] = { ...entry, amount: v }
                        setAdditionalIncome(next)
                        markDirty()
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      setAdditionalIncome(additionalIncome.filter((x) => x.id !== entry.id))
                      markDirty()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{labels.fixedDonations}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fixedSnapshots.map((snap) => (
                <div key={snap.donationId} className="flex justify-between text-sm">
                  <span>{snap.name}</span>
                  <span className="font-medium tabular-nums">{formatShekels(snap.amount)}</span>
                </div>
              ))}
              {fixedSnapshots.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noData}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{labels.oneTimeDonations}</CardTitle>
              <Button size="sm" variant="outline" onClick={addOneTime}>
                <Plus className="h-4 w-4" />
                {labels.addEntry}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {oneTimeDonations.map((donation, i) => (
                <div key={donation.id} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      placeholder={labels.description}
                      value={donation.description}
                      onChange={(e) => {
                        const next = [...oneTimeDonations]
                        next[i] = { ...donation, description: e.target.value }
                        setOneTimeDonations(next)
                        markDirty()
                      }}
                    />
                  </div>
                  <div className="w-32 shrink-0">
                    <MoneyInput
                      label=""
                      valueAgorot={donation.amount}
                      onChangeAgorot={(v) => {
                        const next = [...oneTimeDonations]
                        next[i] = { ...donation, amount: v }
                        setOneTimeDonations(next)
                        markDirty()
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      setOneTimeDonations(oneTimeDonations.filter((x) => x.id !== donation.id))
                      markDirty()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <ReportCalculationsPanel
          calculations={calculations}
          openingDebt={openingDebt}
          appliedCredit={appliedCredit}
          creditAvailable={creditFromPreviousMonth}
          applyCredit={applyCreditFromPrevious}
        />
      </div>
    </div>
  )
}
