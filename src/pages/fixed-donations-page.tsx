import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat, Plus, Pencil } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { useFixedDonations, useInvalidateHousehold } from '@/hooks/use-household-data'
import { fixedDonationSchema, type FixedDonationForm } from '@/schemas'
import { shekelsToAgorot, formatShekels } from '@/utils/currency'
import { db } from '@/lib/firebase'
import * as fixedService from '@/services/fixed-donations.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import type { FixedDonation } from '@/types'
import { MONTH_NAMES_HE } from '@/lib/constants'

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
  const { profile, user } = useAuth()
  const invalidate = useInvalidateHousehold()
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const onSubmit = form.handleSubmit(async (data) => {
    try {
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
          ? (donations?.find((d) => d.id === editingId) as unknown as Record<string, unknown>)
          : null

      await fixedService.saveFixedDonation(
        db,
        donation,
        user.uid,
        user.displayName ?? '',
        before,
      )

      invalidate()
      closeForm()
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  })

  const handleDelete = async (donation: FixedDonation): Promise<void> => {
    try {
      if (!db || !user) return
      await fixedService.deleteFixedDonation(db, donation, user.uid, user.displayName ?? '')
      invalidate()
      toast({ title: labels.deleted })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  }

  if (isLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{labels.fixedDonations}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {labels.addEntry}
        </Button>
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

      {!donations?.length && !editingId ? (
        <EmptyState icon={Repeat} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {donations?.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{d.name}</CardTitle>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => void handleDelete(d)}
                  >
                    {labels.delete}
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
                  <span>
                    {MONTH_NAMES_HE[d.startMonth - 1]} {d.startYear}
                  </span>
                </div>
                {d.endYear && d.endMonth && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-muted-foreground)]">{labels.endDate}</span>
                    <span>
                      {MONTH_NAMES_HE[d.endMonth - 1]} {d.endYear}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
