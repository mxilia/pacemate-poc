import { z } from 'zod'
import { coachContextSchema } from './schema'

export const userSessionSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().transform((email) => email.trim().toLowerCase()),
})
export const runnerDataSchema = z.object({
  version: z.literal('1.0'),
  profile: coachContextSchema.shape.profile,
  plan: coachContextSchema.shape.plan,
  partners: z.array(
    z.object({
      name: z.string(),
      age: z.number(),
      level: z.string(),
      matchScore: z.number(),
      time: z.string(),
      note: z.string(),
    }),
  ),
  runs: z.array(
    coachContextSchema.shape.runs.element.extend({
      analysis: z
        .object({
          distanceKm: z.number().nonnegative(),
          time: z.string(),
          pace: z.string(),
          coachNote: z.string(),
          nextStep: z.string(),
        })
        .optional(),
    }),
  ),
  user: userSessionSchema.nullable().default(null),
  invitedPartners: z.array(z.string().min(1)).default([]),
  coachAdviceKey: z.string().default(''),
  runDraft: z
    .object({ distanceKm: z.number().nonnegative(), seconds: z.number().int().nonnegative() })
    .nullable()
    .default(null),
  nutritionMessages: z
    .array(
      z.object({
        date: z.iso.date(),
        role: z.enum(['assistant', 'user']),
        content: z.string().min(1).max(12000),
      }),
    )
    .default([]),
  hasCompletedOnboarding: z.boolean(),
  step: z.number().int().min(0).max(7),
  messages: z.array(z.object({ role: z.enum(['ai', 'user']), text: z.string() })),
  mealLogs: z.array(
    z.object({ date: z.iso.date(), meal: coachContextSchema.shape.today.shape.meals.element }),
  ),
  nutrition: z.object({
    date: z.iso.date(),
    consumed: coachContextSchema.shape.today.shape.macros,
    recommended: coachContextSchema.shape.today.shape.nutritionTargets,
  }),
  coachMessages: z.array(
    z.object({ role: z.enum(['assistant', 'user']), content: z.string().min(1).max(12000) }),
  ),
})
