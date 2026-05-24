import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import type {
  Household,
  HouseholdInvite,
  HouseholdMember,
  HouseholdSettings,
} from '@/types'

function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createHousehold(
  db: Firestore,
  name: string,
  userId: string,
  email: string,
  displayName: string,
  photoURL: string | null,
): Promise<Household> {
  const now = new Date().toISOString()
  const householdRef = await addDoc(collection(db, COLLECTIONS.households), {
    name,
    createdAt: now,
    createdBy: userId,
  })

  const memberId = generateId()
  await setDoc(doc(db, COLLECTIONS.householdMembers, memberId), {
    householdId: householdRef.id,
    userId,
    email,
    displayName,
    photoURL,
    role: 'owner',
    joinedAt: now,
  })

  await setDoc(
    doc(db, COLLECTIONS.householdSettings, householdRef.id),
    {
      householdId: householdRef.id,
      creditCarryForwardEnabled: false,
      updatedAt: now,
      updatedBy: userId,
    },
  )

  await updateDoc(doc(db, COLLECTIONS.userProfiles, userId), {
    activeHouseholdId: householdRef.id,
  })

  return {
    id: householdRef.id,
    name,
    createdAt: now,
    createdBy: userId,
  }
}

export async function joinHouseholdByCode(
  db: Firestore,
  code: string,
  userId: string,
  email: string,
  displayName: string,
  photoURL: string | null,
): Promise<Household> {
  const invitesQuery = query(
    collection(db, COLLECTIONS.householdInvites),
    where('code', '==', code.toUpperCase()),
  )
  const invitesSnap = await getDocs(invitesQuery)

  if (invitesSnap.empty) {
    throw new Error('קוד הזמנה לא תקין')
  }

  const inviteDoc = invitesSnap.docs[0]
  if (!inviteDoc) throw new Error('קוד הזמנה לא תקין')

  const invite = inviteDoc.data() as HouseholdInvite
  const expiresAt = new Date(invite.expiresAt)
  if (expiresAt < new Date()) {
    throw new Error('קוד ההזמנה פג תוקף')
  }

  const householdRef = doc(db, COLLECTIONS.households, invite.householdId)
  const householdSnap = await getDoc(householdRef)
  if (!householdSnap.exists()) {
    throw new Error('משק הבית לא נמצא')
  }

  const existingMember = await getDocs(
    query(
      collection(db, COLLECTIONS.householdMembers),
      where('householdId', '==', invite.householdId),
      where('userId', '==', userId),
    ),
  )

  if (existingMember.empty) {
    const now = new Date().toISOString()
    await setDoc(doc(db, COLLECTIONS.householdMembers, generateId()), {
      householdId: invite.householdId,
      userId,
      email,
      displayName,
      photoURL,
      role: 'member',
      joinedAt: now,
    })
  }

  await updateDoc(doc(db, COLLECTIONS.userProfiles, userId), {
    activeHouseholdId: invite.householdId,
  })

  const data = householdSnap.data()
  return {
    id: householdSnap.id,
    name: data.name as string,
    createdAt: data.createdAt as string,
    createdBy: data.createdBy as string,
  }
}

export async function fetchHousehold(
  db: Firestore,
  householdId: string,
): Promise<Household | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.households, householdId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    id: snap.id,
    name: data.name as string,
    createdAt: data.createdAt as string,
    createdBy: data.createdBy as string,
  }
}

export async function fetchMembers(
  db: Firestore,
  householdId: string,
): Promise<HouseholdMember[]> {
  const q = query(
    collection(db, COLLECTIONS.householdMembers),
    where('householdId', '==', householdId),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      householdId: data.householdId as string,
      userId: data.userId as string,
      email: data.email as string,
      displayName: data.displayName as string,
      photoURL: (data.photoURL as string | null) ?? null,
      role: data.role as HouseholdMember['role'],
      joinedAt: data.joinedAt as string,
    }
  })
}

export async function fetchSettings(
  db: Firestore,
  householdId: string,
): Promise<HouseholdSettings> {
  const snap = await getDoc(
    doc(db, COLLECTIONS.householdSettings, householdId),
  )
  if (!snap.exists()) {
    return {
      id: householdId,
      householdId,
      creditCarryForwardEnabled: false,
      updatedAt: new Date().toISOString(),
      updatedBy: '',
    }
  }
  const data = snap.data()
  return {
    id: snap.id,
    householdId: data.householdId as string,
    creditCarryForwardEnabled: data.creditCarryForwardEnabled as boolean,
    updatedAt: data.updatedAt as string,
    updatedBy: data.updatedBy as string,
  }
}

export async function updateSettings(
  db: Firestore,
  householdId: string,
  creditCarryForwardEnabled: boolean,
  userId: string,
): Promise<void> {
  await setDoc(
    doc(db, COLLECTIONS.householdSettings, householdId),
    {
      householdId,
      creditCarryForwardEnabled,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    },
    { merge: true },
  )
}

export async function createInvite(
  db: Firestore,
  householdId: string,
  userId: string,
): Promise<string> {
  const code = randomInviteCode()
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 7)

  await addDoc(collection(db, COLLECTIONS.householdInvites), {
    householdId,
    code,
    createdBy: userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  })

  return code
}

export async function removeMember(
  db: Firestore,
  memberId: string,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.householdMembers, memberId))
}

export async function getUserMembership(
  db: Firestore,
  userId: string,
): Promise<HouseholdMember | null> {
  const q = query(
    collection(db, COLLECTIONS.householdMembers),
    where('userId', '==', userId),
  )
  const snap = await getDocs(q)
  const first = snap.docs[0]
  if (!first) return null
  const data = first.data()
  return {
    id: first.id,
    householdId: data.householdId as string,
    userId: data.userId as string,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: (data.photoURL as string | null) ?? null,
    role: data.role as HouseholdMember['role'],
    joinedAt: data.joinedAt as string,
  }
}
