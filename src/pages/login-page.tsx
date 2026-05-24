import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { labels } from '@/lib/hebrew'
import { useAuth } from '@/contexts/auth-context'
import { isFirebaseConfigured } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getHebrewErrorMessage } from '@/utils/errors'
import { toast } from '@/hooks/use-toast'

export function LoginPage() {
  const { signIn, enterDemo } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async (): Promise<void> => {
    setLoading(true)
    try {
      await signIn()
    } catch (error) {
      toast({
        title: labels.errorAuth,
        description: getHebrewErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-teal-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <Wallet className="h-8 w-8 text-teal-700" />
          </div>
          <CardTitle>{labels.appName}</CardTitle>
          <CardDescription>
            ניהול הכנסות, מעשרות ותרומות למשק בית משותף
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFirebaseConfigured() ? (
            <Button className="w-full" onClick={() => void handleGoogleSignIn()} disabled={loading}>
              {loading ? labels.loading : labels.signIn}
            </Button>
          ) : (
            <p className="text-center text-sm text-amber-700">
              Firebase לא מוגדר. השתמשו במצב הדגמה או הגדירו משתני סביבה.
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={enterDemo}>
            כניסה למצב הדגמה
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
