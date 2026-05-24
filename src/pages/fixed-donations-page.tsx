import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat, Plus } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { useFixedDonations, useInvalidateHousehold } from '@/hooks/use-household-data'
import { fixedDonationSchema, type FixedDonationForm } from '@/schemas'
import { shekelsToAgorot } from '@/utils/currency'
import { formatShekels } from '@/utils/currency'
import { db } from '@/lib/firebase'
import * as fixedService from '@/services/fixed-donations.service'
import { demoStore } from '@/services/demo-store'
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

export function FixedDonationsPage() {
  const { data: donations, isLoading } = useFixedDonations()
  const { profile, user, isDemo } = useAuth()
  const invalidate = useInvalidateHousehold()
  const [showForm, setShowForm] = useState(false)
  const householdId = profile?.activeHouseholdId ?? ''

  const form = useForm<FixedDonationForm>({
    resolver: zodResolver(fixedDonationSchema),
    defaultValues: {
      name: '',
      amount: 0,
      startYear: new Date().getFullYear(),
      startMonth: 1,
      endYear: null,
      endMonth: null,
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const donation = {
        householdId,
        name: data.name,
        amount: data.amount,
        startYear: data.startYear,
        startMonth: data.startMonth,
        endYear: data.endYear,
        endMonth: data.endMonth,
        isActive: true,
        createdBy: profile?.uid ?? user?.uid ?? '',
      }

      if (isDemo) {
        demoStore.update((s) => {
          s.fixedDonations.push({
            ...donation,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: profile?.uid ?? '',
          })
        })
      } else if (db && user) {
        await fixedService.saveFixedDonation(db, donation, user.uid, user.displayName ?? '', null)
      }

      invalidate()
      setShowForm(false)
      form.reset()
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  })

  const handleDelete = async (donation: FixedDonation): Promise<void> => {
    try {
      if (isDemo) {
        demoStore.update((s) => {
          s.fixedDonations = s.fixedDonations.filter((d) => d.id !== donation.id)
        })
      } else if (db && user) {
        await fixedService.deleteFixedDonation(db, donation, user.uid, user.displayName ?? '')
      }
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
        <h1 className="text-2xl font-bold">{labels.fixedDonations}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {labels.addEntry}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>תרומה קבועה חדשה</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onSubmit(e)} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{labels.donationName}</Label>
                <Input {...form.register('name')} />
              </div>
              <div>
                <Label>{labels.amount} (₪)</Label>
                <Input
                  type="number"
                  onChange={(e) =>
                    form.setValue('amount', shekelsToAgorot(Number(e.target.value) || 0))
                  }
                />
              </div>
              <div>
                <Label>{labels.startDate}</Label>
                <div className="flex gap-2">
                  <Input type="number" {...form.register('startYear', { valueAsNumber: true })} />
                  <Input type="number" {...form.register('startMonth', { valueAsNumber: true })} min={1} max={12} />
                </div>
              </div>
              <Button type="submit">{labels.save}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!donations?.length ? (
        <EmptyState icon={Repeat} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {donations.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{d.name}</CardTitle>
                <Button variant="destructive" size="sm" onClick={() => void handleDelete(d)}>
                  {labels.delete}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{labels.amount}</span>
                  <span>{formatShekels(d.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{labels.startDate}</span>
                  <span>
                    {MONTH_NAMES_HE[d.startMonth - 1]} {d.startYear}
                  </span>
                </div>
                {d.endYear && d.endMonth && (
                  <div className="flex justify-between">
                    <span>{labels.endDate}</span>
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
