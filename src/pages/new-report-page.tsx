import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { labels } from '@/lib/hebrew'
import { MONTH_NAMES_HE } from '@/lib/constants'
import { defaultNewReportMonth } from '@/utils/dates'
import { useReports } from '@/hooks/use-household-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export function NewReportPage() {
  const navigate = useNavigate()
  const { data: reports } = useReports()
  const defaults = defaultNewReportMonth()
  const [year, setYear] = useState(defaults.year)
  const [month, setMonth] = useState(defaults.month)

  const handleContinue = (): void => {
    const exists = reports?.some((r) => r.year === year && r.month === month)
    if (exists) {
      toast({
        title: labels.errorDuplicateReport,
        variant: 'destructive',
      })
      return
    }
    navigate(`/reports/${year}/${month}?new=1`)
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{labels.newReport}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          בחרו חודש ושנה ליצירת דוח חדש
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.createReport}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year">{labels.year}</Label>
            <select
              id="year"
              className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">{labels.month}</Label>
            <select
              id="month"
              className="flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES_HE.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleContinue}>
              {labels.continueToReport}
            </Button>
            <Button variant="outline" onClick={() => navigate('/reports')}>
              {labels.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
