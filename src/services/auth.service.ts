import {
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth'
import { COLLECTIONS } from '@/lib/constants'
import { googleProvider } from '@/lib/firebase'
import type { UserProfile } from '@/types'

export async function signInWithGoogle(auth: Auth): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut(auth: Auth): Promise<void> {
  await firebaseSignOut(auth)
}

export function subscribeToAuth(
  auth: Auth,
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function upsertUserProfile(
  db: Firestore,
  user: User,
): Promise<UserProfile> {
  const ref = doc(db, COLLECTIONS.userProfiles, user.uid)
  const snap = await getDoc(ref)
  const now = new Date().toISOString()

  if (snap.exists()) {
    const data = snap.data()
    return {
      uid: user.uid,
      email: user.email ?? (data.email as string),
      displayName: user.displayName ?? (data.displayName as string),
      photoURL: user.photoURL ?? (data.photoURL as string | null),
      activeHouseholdId: (data.activeHouseholdId as string | null) ?? null,
    }
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email ?? 'משתמש',
    photoURL: user.photoURL,
    activeHouseholdId: null,
  }

  await setDoc(ref, { ...profile, createdAt: now })
  return profile
}

export async function fetchUserProfile(
  db: Firestore,
  uid: string,
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.userProfiles, uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: (data.photoURL as string | null) ?? null,
    activeHouseholdId: (data.activeHouseholdId as string | null) ?? null,
  }
}

export async function setActiveHousehold(
  db: Firestore,
  uid: string,
  householdId: string,
): Promise<void> {
  await setDoc(
    doc(db, COLLECTIONS.userProfiles, uid),
    { activeHouseholdId: householdId },
    { merge: true },
  )
}
