import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  type Firestore,
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { createAuditLog } from '@/services/audit.service'
import type { FixedDonation } from '@/types'

function mapDonation(id: string, data: Record<string, unknown>): FixedDonation {
  return {
    id,
    householdId: data.householdId as string,
    name: data.name as string,
    amount: data.amount as number,
    startYear: data.startYear as number,
    startMonth: data.startMonth as number,
    endYear: (data.endYear as number | null) ?? null,
    endMonth: (data.endMonth as number | null) ?? null,
    isActive: data.isActive as boolean,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    createdBy: data.createdBy as string,
  }
}

export async function fetchFixedDonations(
  db: Firestore,
  householdId: string,
): Promise<FixedDonation[]> {
  const q = query(
    collection(db, COLLECTIONS.fixedDonations),
    where('householdId', '==', householdId),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapDonation(d.id, d.data()))
}

export async function saveFixedDonation(
  db: Firestore,
  donation: Omit<FixedDonation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  userId: string,
  userDisplayName: string,
  beforeState: Record<string, unknown> | null,
): Promise<FixedDonation> {
  const now = new Date().toISOString()
  const id = donation.id ?? generateId()
  const isNew = !donation.id

  const data: FixedDonation = {
    id,
    householdId: donation.householdId,
    name: donation.name,
    amount: donation.amount,
    startYear: donation.startYear,
    startMonth: donation.startMonth,
    endYear: donation.endYear,
    endMonth: donation.endMonth,
    isActive: donation.isActive,
    createdAt: isNew ? now : (beforeState?.createdAt as string) ?? now,
    updatedAt: now,
    createdBy: isNew ? userId : (beforeState?.createdBy as string) ?? userId,
  }

  await setDoc(doc(db, COLLECTIONS.fixedDonations, id), data)

  await createAuditLog(db, {
    householdId: donation.householdId,
    userId,
    userDisplayName,
    actionType: isNew ? 'create' : 'update',
    entityType: 'fixedDonation',
    entityId: id,
    beforeState,
    afterState: data as unknown as Record<string, unknown>,
  })

  return data
}

export async function deleteFixedDonation(
  db: Firestore,
  donation: FixedDonation,
  userId: string,
  userDisplayName: string,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.fixedDonations, donation.id))
  await createAuditLog(db, {
    householdId: donation.householdId,
    userId,
    userDisplayName,
    actionType: 'delete',
    entityType: 'fixedDonation',
    entityId: donation.id,
    beforeState: donation as unknown as Record<string, unknown>,
    afterState: null,
  })
}
