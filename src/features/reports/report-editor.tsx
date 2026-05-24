import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Download } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { generateId } from '@/lib/utils'
import { AUTOSAVE_DEBOUNCE_MS } from '@/lib/constants'
import { useAuth } from '@/contexts/auth-context'
import { useDebounce } from '@/hooks/use-debounce'
import {
  useFixedDonations,
  useReport,
  useSettings,
  useInvalidateHousehold,
} from '@/hooks/use-household-data'
import { computeReportCalculations } from '@/utils/finance'
import { buildFixedSnapshots } from '@/services/reports.service'
import { demoStore } from '@/services/demo-store'
import { db } from '@/lib/firebase'
import * as reportsService from '@/services/reports.service'
import type { AdditionalIncomeEntry, MonthlyReport, OneTimeDonation } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MoneyInput } from '@/components/shared/money-input'
import { ReportCalculationsPanel } from '@/features/reports/report-calculations-panel'
import { exportReportToCsv, exportReportToExcel } from '@/utils/export'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import { formatMonthLabel } from '@/utils/dates'
import { formatShekels } from '@/utils/currency'

interface ReportEditorProps {
  year: number
  month: number
  isNew: boolean
}

export function ReportEditor({ year, month, isNew }: ReportEditorProps) {
  const navigate = useNavigate()
  const { profile, user, isDemo } = useAuth()
  const { data: existing } = useReport(year, month)
  const { data: settings } = useSettings()
  const { data: fixedDonations } = useFixedDonations()
  const invalidate = useInvalidateHousehold()

  const creditEnabled = settings?.creditCarryForwardEnabled ?? false
  const householdId = profile?.activeHouseholdId ?? ''
  const userId = isDemo ? (profile?.uid ?? '') : (user?.uid ?? '')
  const userName = isDemo ? (profile?.displayName ?? '') : (user?.displayName ?? '')

  const [salaryHusband, setSalaryHusband] = useState(0)
  const [salaryWife, setSalaryWife] = useState(0)
  const [additionalIncome, setAdditionalIncome] = useState<AdditionalIncomeEntry[]>([])
  const [oneTimeDonations, setOneTimeDonations] = useState<OneTimeDonation[]>([])
  const [openingDebt, setOpeningDebt] = useState(0)
  const [openingCredit, setOpeningCredit] = useState(0)
  const [fixedSnapshots, setFixedSnapshots] = useState<MonthlyReport['fixedDonationSnapshots']>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    const init = async (): Promise<void> => {
      if (existing) {
        setSalaryHusband(existing.salaryHusband)
        setSalaryWife(existing.salaryWife)
        setAdditionalIncome(existing.additionalIncome)
        setOneTimeDonations(existing.oneTimeDonations)
        setOpeningDebt(existing.openingDebt)
        setOpeningCredit(existing.openingCredit)
        setFixedSnapshots(existing.fixedDonationSnapshots)
        setInitialized(true)
        return
      }

      if (isNew && fixedDonations) {
        const snapshots = buildFixedSnapshots(fixedDonations, year, month)
        setFixedSnapshots(snapshots)

        if (isDemo) {
          const reports = demoStore.getState().reports
          const prev = reports
            .filter((r) => r.householdId === householdId)
            .sort((a, b) => b.year - a.year || b.month - a.month)[0]
          if (prev) {
            setSalaryHusband(prev.salaryHusband)
            setSalaryWife(prev.salaryWife)
            setOpeningDebt(prev.closingDebt)
            setOpeningCredit(creditEnabled ? prev.closingCredit : 0)
          }
        } else if (db && householdId) {
          const balances = await reportsService.getOpeningBalances(
            db,
            householdId,
            year,
            month,
            creditEnabled,
          )
          setSalaryHusband(balances.prevSalaries.husband)
          setSalaryWife(balances.prevSalaries.wife)
          setOpeningDebt(balances.openingDebt)
          setOpeningCredit(balances.openingCredit)
        }
      }
      setInitialized(true)
    }

    void init()
  }, [existing, isNew, fixedDonations, year, month, householdId, creditEnabled, isDemo, initialized])

  const calculations = useMemo(
    () =>
      computeReportCalculations({
        salaryHusband,
        salaryWife,
        additionalIncome,
        fixedDonationSnapshots: fixedSnapshots,
        oneTimeDonations,
        openingDebt,
        openingCredit,
        creditCarryForwardEnabled: creditEnabled,
      }),
    [
      salaryHusband,
      salaryWife,
      additionalIncome,
      fixedSnapshots,
      oneTimeDonations,
      openingDebt,
      openingCredit,
      creditEnabled,
    ],
  )

  const draftReport = useMemo((): MonthlyReport => {
    const now = new Date().toISOString()
    return {
      id: existing?.id ?? '',
      householdId,
      year,
      month,
      salaryHusband,
      salaryWife,
      additionalIncome,
      oneTimeDonations,
      fixedDonationSnapshots: fixedSnapshots,
      openingDebt,
      openingCredit,
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
    salaryHusband,
    salaryWife,
    additionalIncome,
    oneTimeDonations,
    fixedSnapshots,
    calculations,
    userId,
  ])

  const debouncedDraft = useDebounce(draftReport, AUTOSAVE_DEBOUNCE_MS)

  const save = useCallback(
    async (report: MonthlyReport) => {
      if (!householdId) return
      setSaving(true)
      try {
        if (isDemo) {
          demoStore.update((s) => {
            const idx = s.reports.findIndex((r) => r.id === report.id)
            const payload = { ...report, id: report.id || `report-${year}-${month}` }
            if (idx >= 0) s.reports[idx] = payload
            else s.reports.push(payload)
          })
        } else if (db) {
          await reportsService.saveReport(
            db,
            report,
            creditEnabled,
            userId,
            userName,
            isNew && !existing,
            existing ? (existing as unknown as Record<string, unknown>) : null,
          )
        }
        setDirty(false)
        invalidate()
      } catch (error) {
        toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
      } finally {
        setSaving(false)
      }
    },
    [householdId, isDemo, creditEnabled, userId, userName, isNew, existing, year, month, invalidate],
  )

  useEffect(() => {
    if (!initialized || !dirty) return
    void save(debouncedDraft)
  }, [debouncedDraft, dirty, initialized, save])

  const markDirty = (): void => setDirty(true)

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isNew ? labels.newReport : labels.edit} — {formatMonthLabel(year, month)}
          </h1>
          {(dirty || saving) && (
            <p className="text-sm text-amber-600">
              {saving ? labels.loading : labels.unsavedChanges}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToExcel(draftReport, creditEnabled)}
          >
            <Download className="h-4 w-4" />
            {labels.exportExcel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReportToCsv(draftReport, creditEnabled)}
          >
            {labels.exportCsv}
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            {labels.cancel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{labels.income}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <MoneyInput
                label={labels.salaryHusband}
                valueAgorot={salaryHusband}
                onChangeAgorot={(v) => {
                  setSalaryHusband(v)
                  markDirty()
                }}
              />
              <MoneyInput
                label={labels.salaryWife}
                valueAgorot={salaryWife}
                onChangeAgorot={(v) => {
                  setSalaryWife(v)
                  markDirty()
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{labels.additionalIncome}</CardTitle>
              <Button size="sm" variant="outline" onClick={addAdditionalIncome}>
                <Plus className="h-4 w-4" />
                {labels.addEntry}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {additionalIncome.length === 0 && (
                <p className="text-sm text-slate-500">{labels.noData}</p>
              )}
              {additionalIncome.map((entry, i) => (
                <div key={entry.id} className="flex gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
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
                  <span className="font-medium">{formatShekels(snap.amount)}</span>
                </div>
              ))}
              {fixedSnapshots.length === 0 && (
                <p className="text-sm text-slate-500">{labels.noData}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{labels.oneTimeDonations}</CardTitle>
              <Button size="sm" variant="outline" onClick={addOneTime}>
                <Plus className="h-4 w-4" />
                {labels.addEntry}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {oneTimeDonations.map((donation, i) => (
                <div key={donation.id} className="flex gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
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
          openingCredit={openingCredit}
          creditEnabled={creditEnabled}
        />
      </div>
    </div>
  )
}
