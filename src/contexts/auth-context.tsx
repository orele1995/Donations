import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import { auth, db, isFirebaseConfigured } from '@/lib/firebase'
import {
  signInWithGoogle,
  signOut,
  subscribeToAuth,
  upsertUserProfile,
} from '@/services/auth.service'
import { DEMO_USER_ID } from '@/seed/data'
import { initDemoStore } from '@/services/demo-store'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isDemo: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  enterDemo: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const demoUser: UserProfile = {
  uid: DEMO_USER_ID,
  email: 'demo@example.com',
  displayName: 'משתמש הדגמה',
  photoURL: null,
  activeHouseholdId: 'demo-household-1',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    initDemoStore()

    if (!isFirebaseConfigured() || !auth) {
      setIsLoading(false)
      return
    }

    const unsub = subscribeToAuth(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser && db) {
        const p = await upsertUserProfile(db, firebaseUser)
        setProfile(p)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return unsub
  }, [])

  const handleSignIn = async (): Promise<void> => {
    if (!auth || !db) throw new Error('Firebase לא מוגדר')
    const firebaseUser = await signInWithGoogle(auth)
    const p = await upsertUserProfile(db, firebaseUser)
    setProfile(p)
    setIsDemo(false)
  }

  const handleSignOut = async (): Promise<void> => {
    if (auth) await signOut(auth)
    setUser(null)
    setProfile(null)
    setIsDemo(false)
  }

  const enterDemo = (): void => {
    setIsDemo(true)
    setProfile(demoUser)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isDemo,
        signIn: handleSignIn,
        signOut: handleSignOut,
        enterDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
