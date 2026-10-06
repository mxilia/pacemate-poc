import { z } from 'zod'
import type { RunnerProfile } from '@/types/coach-ai'

const numberFromText = (value: string) => {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(?:kg|cm|years?)?$/i)
  return match ? Number(match[1]) : Number.NaN
}

const healthSchema = z.object({
  weightKg: z.string().refine((value) => {
    const weight = numberFromText(value)

    return weight >= 30 && weight <= 250
  }, 'Enter a realistic weight between 30 and 250 kg.'),
  heightCm: z.string().refine((value) => {
    const height = numberFromText(value)

    return height >= 100 && height <= 230
  }, 'Enter a realistic height between 100 and 230 cm.'),
  age: z.string().refine((value) => {
    const age = numberFromText(value)

    return Number.isInteger(age) && age >= 13 && age <= 90
  }, 'Enter an age between 13 and 90.'),
  medicalConditions: z.string(),
})

const currentAbilitySchema = z.string().trim().min(4, 'Tell the coach what you can run today.')
const consistencySchema = z
  .string()
  .trim()
  .min(4, 'Share at least one thing that affects consistency.')
const ageRangeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\s*-\s*\d{2}$/, 'Use an age range like 25-40.')
  .refine((value) => {
    const [min, max] = value.split('-').map(Number)
    return min >= 13 && max <= 90 && min <= max
  }, 'Use an ordered age range between 13 and 90.')

export const validateOnboardingStep = (step: number, profile: RunnerProfile) => {
  if (step === 0) {
    return healthSchema.safeParse(profile.health)
  }

  if (step === 3) {
    return currentAbilitySchema.safeParse(profile.currentAbility)
  }

  if (step === 4) {
    return z
      .object({
        daysPerWeek: z.string().refine((value) => {
          const count = numberFromText(value)

          return Number.isInteger(count) && count >= 1 && count <= 7
        }, 'Choose 1 to 7 available run days per week.'),
        days: z.array(z.string()).min(1, 'Pick at least one available day.'),
        time: z.string().min(1, 'Choose a preferred run time.'),
      })
      .refine(
        (schedule) => Number(schedule.daysPerWeek) <= new Set(schedule.days).size,
        'Choose enough available days for your weekly run target.',
      )
      .safeParse(profile.schedule)
  }

  if (step === 6) {
    return consistencySchema.safeParse(profile.consistencyBlocker)
  }

  if (step === 7) {
    return ageRangeSchema.safeParse(profile.partnerPreference.ageRange)
  }

  return z.unknown().safeParse(profile)
}
