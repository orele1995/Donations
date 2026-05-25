import { z } from 'zod'

export const shekelAmountSchema = z
  .number()
  .int('הסכום חייב להיות שלם')
  .min(0, 'הסכום לא יכול להיות שלילי')

export const householdNameSchema = z.object({
  name: z.string().min(2, 'שם משק הבית חייב להכיל לפחות 2 תווים').max(80),
})

export const inviteCodeSchema = z.object({
  code: z.string().min(6, 'קוד הזמנה לא תקין').max(12),
})

export const additionalIncomeSchema = z.object({
  description: z.string().min(1, 'נדרש תיאור').max(100),
  amount: shekelAmountSchema,
})

export const oneTimeDonationSchema = z.object({
  description: z.string().min(1, 'נדרש תיאור').max(100),
  amount: shekelAmountSchema,
})

export const fixedDonationSchema = z.object({
  name: z.string().min(1, 'נדרש שם').max(100),
  amount: shekelAmountSchema,
  startYear: z.number().int().min(2000).max(2100),
  startMonth: z.number().int().min(1).max(12),
  endYear: z.number().int().min(2000).max(2100).nullable(),
  endMonth: z.number().int().min(1).max(12).nullable(),
})

export type HouseholdNameForm = z.infer<typeof householdNameSchema>
export type InviteCodeForm = z.infer<typeof inviteCodeSchema>
export type FixedDonationForm = z.infer<typeof fixedDonationSchema>
export type AdditionalIncomeForm = z.infer<typeof additionalIncomeSchema>
export type OneTimeDonationForm = z.infer<typeof oneTimeDonationSchema>
