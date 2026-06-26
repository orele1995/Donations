import type { FixedDonationSnapshot, OneTimeDonation } from '@/types'

export function sortByHebrewName(a: string, b: string): number {
  return a.localeCompare(b, 'he')
}

export function sortFixedSnapshots(
  snapshots: FixedDonationSnapshot[],
): FixedDonationSnapshot[] {
  return [...snapshots].sort((a, b) => sortByHebrewName(a.name, b.name))
}

export function sortOneTimeDonations(donations: OneTimeDonation[]): OneTimeDonation[] {
  return [...donations].sort((a, b) => sortByHebrewName(a.description, b.description))
}

export function sortFixedDonationsByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => sortByHebrewName(a.name, b.name))
}
