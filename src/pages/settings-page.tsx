import { labels } from '@/lib/hebrew'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{labels.settings}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{labels.members}</CardTitle>
          <CardDescription>
            עריכת שם לתצוגה לכל חבר משק הבית מתבצעת בדף ניהול החברים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/members">{labels.members}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
