import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import * as householdService from '@/services/household.service'
import * as reportsService from '@/services/reports.service'
import * as fixedService from '@/services/fixed-donations.service'
import * as auditService from '@/services/audit.service'
import { demoStore } from '@/services/demo-store'
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

function useDemo(): boolean {
  const { isDemo } = useAuth()
  return isDemo || !isFirebaseConfigured()
}

export function useHousehold() {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['household', householdId, isDemo],
    queryFn: async (): Promise<Household | null> => {
      if (!householdId) return null
      if (isDemo) {
        return demoStore.getState().households.find((h) => h.id === householdId) ?? null
      }
      if (!db) return null
      return householdService.fetchHousehold(db, householdId)
    },
    enabled: Boolean(householdId),
  })
}

export function useMembers() {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['members', householdId, isDemo],
    queryFn: async (): Promise<HouseholdMember[]> => {
      if (!householdId) return []
      if (isDemo) {
        return demoStore.getState().members.filter((m) => m.householdId === householdId)
      }
      if (!db) return []
      return householdService.fetchMembers(db, householdId)
    },
    enabled: Boolean(householdId),
  })
}

export function useSettings() {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['settings', householdId, isDemo],
    queryFn: async (): Promise<HouseholdSettings | null> => {
      if (!householdId) return null
      if (isDemo) {
        return demoStore.getState().settings.find((s) => s.householdId === householdId) ?? null
      }
      if (!db) return null
      return householdService.fetchSettings(db, householdId)
    },
    enabled: Boolean(householdId),
  })
}

export function useReports() {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['reports', householdId, isDemo],
    queryFn: async (): Promise<MonthlyReport[]> => {
      if (!householdId) return []
      if (isDemo) {
        return demoStore
          .getState()
          .reports.filter((r) => r.householdId === householdId)
          .sort((a, b) => b.year - a.year || b.month - a.month)
      }
      if (!db) return []
      return reportsService.fetchReports(db, householdId)
    },
    enabled: Boolean(householdId),
  })
}

export function useReport(year: number, month: number) {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['report', householdId, year, month, isDemo],
    queryFn: async (): Promise<MonthlyReport | null> => {
      if (!householdId) return null
      if (isDemo) {
        return (
          demoStore
            .getState()
            .reports.find(
              (r) =>
                r.householdId === householdId && r.year === year && r.month === month,
            ) ?? null
        )
      }
      if (!db) return null
      return reportsService.fetchReportByMonth(db, householdId, year, month)
    },
    enabled: Boolean(householdId),
  })
}

export function useFixedDonations() {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['fixedDonations', householdId, isDemo],
    queryFn: async (): Promise<FixedDonation[]> => {
      if (!householdId) return []
      if (isDemo) {
        return demoStore.getState().fixedDonations.filter((d) => d.householdId === householdId)
      }
      if (!db) return []
      return fixedService.fetchFixedDonations(db, householdId)
    },
    enabled: Boolean(householdId),
  })
}

export function useAuditLogs(filters?: { monthKey?: string; userId?: string }) {
  const { profile } = useAuth()
  const isDemo = useDemo()
  const householdId = getHouseholdId(profile)

  return useQuery({
    queryKey: ['auditLogs', householdId, filters, isDemo],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      if (!householdId) return []
      if (isDemo) {
        let logs = demoStore.getState().auditLogs.filter((l) => l.householdId === householdId)
        if (filters?.monthKey) logs = logs.filter((l) => l.monthKey === filters.monthKey)
        if (filters?.userId) logs = logs.filter((l) => l.userId === filters.userId)
        return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      }
      if (!db) return []
      return auditService.fetchAuditLogs(db, householdId, filters)
    },
    enabled: Boolean(householdId),
  })
}

export function useInvalidateHousehold() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries()
  }
}

export function useUpdateSettings() {
  const { profile, user, isDemo } = useAuth()
  const invalidate = useInvalidateHousehold()
  const householdId = getHouseholdId(profile)
  const userId = isDemo ? profile?.uid ?? '' : user?.uid ?? ''

  return useMutation({
    mutationFn: async (creditCarryForwardEnabled: boolean) => {
      if (!householdId || !db && !isDemo) return
      if (isDemo) {
        demoStore.update((s) => {
          const setting = s.settings.find((x) => x.householdId === householdId)
          if (setting) {
            setting.creditCarryForwardEnabled = creditCarryForwardEnabled
            setting.updatedAt = new Date().toISOString()
            setting.updatedBy = userId
          }
        })
        return
      }
      if (!db) return
      await householdService.updateSettings(db, householdId, creditCarryForwardEnabled, userId)
    },
    onSuccess: invalidate,
  })
}
