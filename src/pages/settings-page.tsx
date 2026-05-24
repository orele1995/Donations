import { labels } from '@/lib/hebrew'
import { useSettings, useUpdateSettings } from '@/hooks/use-household-data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { toast } from '@/hooks/use-toast'
import { getHebrewErrorMessage } from '@/utils/errors'

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  if (isLoading) return <LoadingSkeleton rows={2} />

  const handleToggle = async (checked: boolean): Promise<void> => {
    try {
      await updateSettings.mutateAsync(checked)
      toast({ title: labels.saved })
    } catch (error) {
      toast({ title: getHebrewErrorMessage(error), variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{labels.settings}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{labels.creditCarryForward}</CardTitle>
          <CardDescription>{labels.creditCarryForwardHint}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="credit-toggle">{labels.maaserCredit}</Label>
          <Switch
            id="credit-toggle"
            checked={settings?.creditCarryForwardEnabled ?? false}
            onCheckedChange={(v) => void handleToggle(v)}
            disabled={updateSettings.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
