import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  type Firestore,
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/constants'
import { toMonthKey } from '@/utils/dates'
import type { AuditActionType, AuditEntityType, AuditLogEntry } from '@/types'

export async function createAuditLog(
  db: Firestore,
  params: {
    householdId: string
    userId: string
    userDisplayName: string
    actionType: AuditActionType
    entityType: AuditEntityType
    entityId: string
    beforeState: Record<string, unknown> | null
    afterState: Record<string, unknown> | null
    year?: number
    month?: number
  },
): Promise<void> {
  const monthKey =
    params.year && params.month
      ? toMonthKey(params.year, params.month)
      : null

  await addDoc(collection(db, COLLECTIONS.auditLogs), {
    householdId: params.householdId,
    userId: params.userId,
    userDisplayName: params.userDisplayName,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    beforeState: params.beforeState,
    afterState: params.afterState,
    timestamp: new Date().toISOString(),
    monthKey,
  })
}

export async function fetchAuditLogs(
  db: Firestore,
  householdId: string,
  filters?: { monthKey?: string; userId?: string },
): Promise<AuditLogEntry[]> {
  let q = query(
    collection(db, COLLECTIONS.auditLogs),
    where('householdId', '==', householdId),
    orderBy('timestamp', 'desc'),
  )

  const snapshot = await getDocs(q)
  let entries = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      householdId: data.householdId as string,
      userId: data.userId as string,
      userDisplayName: data.userDisplayName as string,
      actionType: data.actionType as AuditLogEntry['actionType'],
      entityType: data.entityType as AuditLogEntry['entityType'],
      entityId: data.entityId as string,
      beforeState: data.beforeState as Record<string, unknown> | null,
      afterState: data.afterState as Record<string, unknown> | null,
      timestamp: data.timestamp as string,
      monthKey: (data.monthKey as string | null) ?? null,
    }
  })

  if (filters?.monthKey) {
    entries = entries.filter((e) => e.monthKey === filters.monthKey)
  }
  if (filters?.userId) {
    entries = entries.filter((e) => e.userId === filters.userId)
  }

  return entries
}
