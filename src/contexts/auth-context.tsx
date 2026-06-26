import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
  }

  const handleSignOut = async (): Promise<void> => {
    if (auth) await signOut(auth)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user || !db) return
    const p = await upsertUserProfile(db, user)
    setProfile(p)
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshProfile,
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
