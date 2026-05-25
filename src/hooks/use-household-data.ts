import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import * as householdService from '@/services/household.service'
import * as reportsService from '@/services/reports.service'
import * as fixedService from '@/services/fixed-donations.service'
import * as auditService from '@/services/audit.service'
import type {
  FixedDonation,
  Household,
  HouseholdMember,
  HouseholdSettings,
  MonthlyReport,
  AuditLogEntry,
} from '@/types'

function getHouseholdId(profile: { activeHouseholdId: string | null } | null): string | null {
  return profile?.activeHouseholdId ?? null
}

export function useHousehold() {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['household', householdId],
    queryFn: async (): Promise<Household | null> => {
      if (!householdId || !db) return null
      return householdService.fetchHousehold(db, householdId)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useMembers() {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['members', householdId],
    queryFn: async (): Promise<HouseholdMember[]> => {
      if (!householdId || !db) return []
      return householdService.fetchMembers(db, householdId)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useSettings() {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['settings', householdId],
    queryFn: async (): Promise<HouseholdSettings | null> => {
      if (!householdId || !db) return null
      return householdService.fetchSettings(db, householdId)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useReports() {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['reports', householdId],
    queryFn: async (): Promise<MonthlyReport[]> => {
      if (!householdId || !db) return []
      return reportsService.fetchReports(db, householdId)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useReport(year: number, month: number, enabled = true) {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['report', householdId, year, month],
    queryFn: async (): Promise<MonthlyReport | null> => {
      if (!householdId || !db) return null
      return reportsService.fetchReportByMonth(db, householdId, year, month)
    },
    enabled: Boolean(householdId && db && enabled),
  })
}

export function useFixedDonations() {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['fixedDonations', householdId],
    queryFn: async (): Promise<FixedDonation[]> => {
      if (!householdId || !db) return []
      return fixedService.fetchFixedDonations(db, householdId)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useAuditLogs(filters?: { monthKey?: string; userId?: string }) {
  const { profile } = useAuth()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['auditLogs', householdId, filters],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      if (!householdId || !db) return []
      return auditService.fetchAuditLogs(db, householdId, filters)
    },
    enabled: Boolean(householdId && db),
  })
}

export function useInvalidateHousehold() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries()
  }
}

export function useUpdateMemberName() {
  const invalidate = useInvalidateHousehold()

  return useMutation({
    mutationFn: async ({
      memberId,
      displayName,
    }: {
      memberId: string
      displayName: string
    }) => {
      if (!db) return
      await householdService.updateMemberDisplayName(db, memberId, displayName)
    },
    onSuccess: invalidate,
  })
}
