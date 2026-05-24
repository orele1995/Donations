import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import * as householdService from '@/services/household.service'
import { demoStore } from '@/services/demo-store'
import { householdNameSchema, inviteCodeSchema, type HouseholdNameForm, type InviteCodeForm } from '@/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'
import { useInvalidateHousehold } from '@/hooks/use-household-data'

export function OnboardingPage() {
  const { user, profile, isDemo } = useAuth()
  const invalidate = useInvalidateHousehold()
  const [mode, setMode] = useState<'create' | 'join'>('create')

  const createForm = useForm<HouseholdNameForm>({
    resolver: zodResolver(householdNameSchema),
    defaultValues: { name: '' },
  })

  const joinForm = useForm<InviteCodeForm>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: { code: '' },
  })

  const handleCreate = createForm.handleSubmit(async (data) => {
    try {
      if (isDemo) {
        toast({ title: 'במצב הדגמה משק הבית כבר קיים' })
        return
      }
      if (!db || !user) return
      await householdService.createHousehold(
        db,
        data.name,
        user.uid,
        user.email ?? '',
        user.displayName ?? '',
        user.photoURL,
      )
      invalidate()
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  })

  const handleJoin = joinForm.handleSubmit(async (data) => {
    try {
      if (isDemo) {
        const state = demoStore.getState()
        const invite = state.invites.find((i) => i.code === data.code.toUpperCase())
        if (!invite) throw new Error('קוד הזמנה לא תקין')
        if (profile) {
          demoStore.update((s) => {
            s.userProfiles[0] = { ...profile, activeHouseholdId: invite.householdId }
          })
        }
        invalidate()
        toast({ title: labels.saved })
        return
      }
      if (!db || !user) return
      await householdService.joinHouseholdByCode(
        db,
        data.code,
        user.uid,
        user.email ?? '',
        user.displayName ?? '',
        user.photoURL,
      )
      invalidate()
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  })

  return (
    <div className="mx-auto max-w-lg py-12">
      <h1 className="mb-2 text-2xl font-bold">{labels.selectHousehold}</h1>
      <p className="mb-6 text-slate-500">{labels.noHousehold}</p>

      <div className="mb-4 flex gap-2">
        <Button variant={mode === 'create' ? 'default' : 'outline'} onClick={() => setMode('create')}>
          {labels.createHousehold}
        </Button>
        <Button variant={mode === 'join' ? 'default' : 'outline'} onClick={() => setMode('join')}>
          {labels.joinHousehold}
        </Button>
      </div>

      {mode === 'create' ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.createHousehold}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <Label htmlFor="name">{labels.householdName}</Label>
                <Input id="name" {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={!isFirebaseConfigured() && !isDemo}>
                {labels.create}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{labels.joinHousehold}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleJoin(e)} className="space-y-4">
              <div>
                <Label htmlFor="code">{labels.inviteCode}</Label>
                <Input id="code" {...joinForm.register('code')} placeholder="DEMO1234" dir="ltr" className="text-left" />
                {joinForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-red-600">{joinForm.formState.errors.code.message}</p>
                )}
                {isDemo && (
                  <p className="mt-2 text-xs text-slate-500">קוד הדגמה: DEMO1234</p>
                )}
              </div>
              <Button type="submit">{labels.join}</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
