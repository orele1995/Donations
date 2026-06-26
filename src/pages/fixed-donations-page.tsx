import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat, Plus, Pencil, Search } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import {
  useFixedDonations,
  useInvalidateHousehold,
  useReports,
} from '@/hooks/use-household-data'
import { useConfirmDelete } from '@/hooks/use-confirm-delete'
import { fixedDonationSchema, type FixedDonationForm } from '@/schemas'
import { shekelsToAgorot, formatShekels } from '@/utils/currency'
import { formatMonthNumeric } from '@/utils/dates'
import {
  getAffectedReports,
  isDonationCurrentlyActive,
  matchesDonationSearch,
} from '@/utils/fixed-donation-utils'
import { sortFixedDonationsByName } from '@/utils/sort'
import { db } from '@/lib/firebase'
import * as fixedService from '@/services/fixed-donations.service'
import * as reportsService from '@/services/reports.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import type { FixedDonation } from '@/types'

const emptyForm: FixedDonationForm = {
  name: '',
  amount: 0,
  startYear: new Date().getFullYear(),
  startMonth: 1,
  endYear: null,
  endMonth: null,
}

export function FixedDonationsPage() {
  const { data: donations, isLoading } = useFixedDonations()
  const { data: reports } = useReports()
  const { profile, user } = useAuth()
  const invalidate = useInvalidateHousehold()
  const { requestDelete, dialog: deleteDialog } = useConfirmDelete<FixedDonation>()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [pendingSave, setPendingSave] = useState<FixedDonationForm | null>(null)
  const householdId = profile?.activeHouseholdId ?? ''

  const form = useForm<FixedDonationForm>({
    resolver: zodResolver(fixedDonationSchema),
    defaultValues: emptyForm,
  })

  const openCreate = (): void => {
    setEditingId('new')
    form.reset(emptyForm)
  }

  const openEdit = (donation: FixedDonation): void => {
    setEditingId(donation.id)
    form.reset({
      name: donation.name,
      amount: donation.amount,
      startYear: donation.startYear,
      startMonth: donation.startMonth,
      endYear: donation.endYear,
      endMonth: donation.endMonth,
    })
  }

  const closeForm = (): void => {
    setEditingId(null)
    form.reset(emptyForm)
  }

  const saveDonation = async (data: FixedDonationForm): Promise<void> => {
    if (!db || !user) return

    const donation = {
      id: editingId === 'new' ? undefined : editingId ?? undefined,
      householdId,
      name: data.name,
      amount: data.amount,
      startYear: data.startYear,
      startMonth: data.startMonth,
      endYear: data.endYear,
      endMonth: data.endMonth,
      isActive: true,
      createdBy: user.uid,
    }

    const before =
      editingId && editingId !== 'new'
        ? donations?.find((d) => d.id === editingId) ?? null
        : null

    const saved = await fixedService.saveFixedDonation(
      db,
      donation,
      user.uid,
      user.displayName ?? '',
      before as unknown as Record<string, unknown> | null,
    )

    const updatedDonations = before
      ? (donations ?? []).map((d) => (d.id === saved.id ? saved : d))
      : [...(donations ?? []), saved]

    const affected = getAffectedReports(
      reports ?? [],
      before,
      {
        startYear: data.startYear,
        startMonth: data.startMonth,
        endYear: data.endYear,
        endMonth: data.endMonth,
      },
    )

    if (affected.length > 0) {
      await reportsService.recalculateAffectedReports(
        db,
        affected,
        updatedDonations,
        user.uid,
        user.displayName ?? '',
      )
    }

    invalidate()
    closeForm()
    toast({ title: labels.saved })
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const before =
        editingId && editingId !== 'new'
          ? donations?.find((d) => d.id === editingId) ?? null
          : null

      const affected = getAffectedReports(
        reports ?? [],
        before,
        {
          startYear: data.startYear,
          startMonth: data.startMonth,
          endYear: data.endYear,
          endMonth: data.endMonth,
        },
      )

      if (affected.length > 0) {
        setPendingSave(data)
        return
      }

      await saveDonation(data)
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  })

  const handleDelete = (donation: FixedDonation): void => {
    requestDelete({
      item: donation,
      executeDelete: async () => {
        if (!db || !user) return
        await fixedService.deleteFixedDonation(
          db,
          donation,
          user.uid,
          user.displayName ?? '',
        )

        const remaining = (donations ?? []).filter((d) => d.id !== donation.id)
        const affected = getAffectedReports(reports ?? [], donation, null)
        if (affected.length > 0) {
          await reportsService.recalculateAffectedReports(
            db,
            affected,
            remaining,
            user.uid,
            user.displayName ?? '',
          )
        }

        invalidate()
      },
    })
  }

  const filteredDonations = sortFixedDonationsByName(donations ?? []).filter((d) => {
    if (activeOnly && !isDonationCurrentlyActive(d)) return false
    return matchesDonationSearch(d, searchQuery)
  })

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{labels.fixedDonations}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {labels.addEntry}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder={labels.searchDonations}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {labels.showActiveOnly}
        </label>
      </div>

      {editingId && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle>
              {editingId === 'new' ? labels.newDonation : labels.editDonation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>{labels.donationName}</Label>
                <Input {...form.register('name')} />
              </div>
              <div>
                <Label>{labels.amount} (₪)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  onChange={(e) =>
                    form.setValue('amount', shekelsToAgorot(Number(e.target.value) || 0))
                  }
                />
              </div>
              <div>
                <Label>{labels.startDate}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={labels.year}
                    {...form.register('startYear', { valueAsNumber: true })}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder={labels.month}
                    {...form.register('startMonth', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div>
                <Label>{labels.endDate}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={labels.year}
                    onChange={(e) =>
                      form.setValue(
                        'endYear',
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    placeholder={labels.month}
                    onChange={(e) =>
                      form.setValue(
                        'endMonth',
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">{labels.save}</Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {labels.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!filteredDonations.length && !editingId ? (
        <EmptyState icon={Repeat} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDonations.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{d.name}</CardTitle>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(d)}>
                    <Pencil className="h-4 w-4" />
                    {labels.edit}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(d)}
                  >
                    {labels.deleteFixedDonation}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-foreground)]">{labels.amount}</span>
                  <span className="font-medium tabular-nums">{formatShekels(d.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-muted-foreground)]">{labels.startDate}</span>
                  <span>{formatMonthNumeric(d.startYear, d.startMonth)}</span>
                </div>
                {d.endYear && d.endMonth && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{labels.endDate}</span>
                    <span>{formatMonthNumeric(d.endYear, d.endMonth)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deleteDialog}

      <AlertDialog open={pendingSave !== null} onOpenChange={(open) => !open && setPendingSave(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.confirmDonationChange}</AlertDialogTitle>
            <AlertDialogDescription>{labels.confirmDonationChangeDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSave) {
                  void saveDonation(pendingSave).catch((error) => {
                    toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
                  })
                  setPendingSave(null)
                }
              }}
            >
              {labels.save}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
