import { z } from 'zod'
import type {
  CoachChatRequest,
  CoachChatResponse,
  NutritionChatRequest,
  NutritionChatResponse,
} from '@/types/coach-ai'

const level = z.enum(['Beginner', 'Intermediate', 'Advanced'])
const sessionSchema = z.object({
  day: z.string(),
  title: z.string(),
  distanceKm: z.number().nonnegative(),
  intensity: z.string(),
  note: z.string(),
})
const mealSchema = z.object({
  name: z.string(),
  type: z.string(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  protein: z.number().nonnegative(),
})
const messageSchema = z.object({
  role: z.enum(['assistant', 'user']),
  content: z.string().trim().min(1).max(12000),
})
export const coachContextSchema = z.object({
  version: z.literal('1.0'),
  generatedAt: z.iso.datetime(),
  timezone: z.string(),
  profile: z.object({
    health: z.object({
      weightKg: z.string(),
      heightCm: z.string(),
      age: z.string(),
      medicalConditions: z.string(),
    }),
    goal: z.enum(['First 5K', 'First 10K', 'Improve pace', 'Run consistently', 'General fitness']),
    level,
    currentAbility: z.string(),
    schedule: z.object({ daysPerWeek: z.string(), days: z.array(z.string()), time: z.string() }),
    trainingLoad: z.enum(['Easy / sustainable', 'Balanced', 'Push me']),
    consistencyBlocker: z.string(),
    partnerPreference: z.object({
      ageRange: z.string(),
      level: z.union([level, z.literal('Any level')]),
      gender: z.enum(['No preference', 'Women', 'Men', 'Mixed group']),
    }),
  }),
  plan: z
    .object({
      headline: z.string(),
      summary: z.string(),
      weeklyDistanceKm: z.number().nonnegative(),
      sessions: z.array(sessionSchema),
      recoveryTips: z.array(z.string()),
      weeklyCoachNote: z.string(),
    })
    .nullable(),
  runs: z.array(
    z.object({
      date: z.iso.datetime(),
      distanceKm: z.number().nonnegative(),
      seconds: z.number().nonnegative(),
    }),
  ),
  today: z.object({
    date: z.iso.date(),
    day: z.string(),
    session: sessionSchema.nullable(),
    nextSession: sessionSchema.nullable(),
    meals: z.array(mealSchema),
    macros: z.object({
      carbs: z.number().nonnegative(),
      fat: z.number().nonnegative(),
      protein: z.number().nonnegative(),
    }),
    nutritionTargets: z.object({
      carbs: z.number().positive(),
      fat: z.number().positive(),
      protein: z.number().positive(),
      caloriesKcal: z.number().positive(),
    }),
  }),
  progress: z.object({
    streakDays: z.number().int().nonnegative(),
    runsThisWeek: z.number().int().nonnegative(),
    weeklyRunTarget: z.number().int().nonnegative(),
    distanceThisWeekKm: z.number().nonnegative(),
    longestRunKm: z.number().nonnegative(),
    targetDistanceKm: z.number().positive().nullable(),
    goalPercent: z.number().min(0).max(100).nullable(),
  }),
  dailyAdvice: z.string(),
})
export const coachRequestSchema: z.ZodType<CoachChatRequest> = z.object({
  context: coachContextSchema,
  messages: z.array(messageSchema).min(1).max(100),
})
export const coachResponseSchema: z.ZodType<CoachChatResponse> = z.object({
  version: z.literal('1.0'),
  message: z.object({ role: z.literal('assistant'), content: z.string().trim().min(1).max(12000) }),
  suggestedReplies: z.array(z.string().min(1).max(100)).max(5),
})

export const nutritionRequestSchema: z.ZodType<NutritionChatRequest> = z.object({
  context: coachContextSchema,
  message: z.string().trim().min(1).max(1000),
})
export const nutritionResponseSchema: z.ZodType<NutritionChatResponse> = z
  .object({
    version: z.literal('1.0'),
    status: z.enum(['logged', 'needs_clarification']),
    message: z.string().trim().min(1).max(2000),
    meal: mealSchema.nullable(),
  })
  .refine((response) => (response.status === 'logged') === (response.meal !== null), {
    message: 'Only successful nutrition entries can contain a meal.',
  })

const compactSessionSchema = z.object({
  day: z.string().max(20),
  title: z.string().max(60),
  distanceKm: z.number().nonnegative(),
})
export const compactCoachRequestSchema = z
  .object({
    context: z.object({
      date: z.iso.date(),
      timezone: z.string().max(80),
      profile: z.object({
        health: z.object({
          weightKg: z.string().max(16),
          heightCm: z.string().max(16),
          age: z.string().max(16),
          medicalConditions: z.string().max(240),
        }),
        goal: coachContextSchema.shape.profile.shape.goal,
        level: coachContextSchema.shape.profile.shape.level,
        currentAbility: z.string().max(200),
        preferredTime: z.string().max(30),
        trainingLoad: coachContextSchema.shape.profile.shape.trainingLoad,
        consistencyBlocker: z.string().max(200),
      }),
      plan: z
        .object({
          weeklyDistanceKm: z.number().nonnegative(),
          sessions: z.array(compactSessionSchema).max(7),
        })
        .nullable(),
      today: z.object({
        session: compactSessionSchema.nullable(),
        nextSession: compactSessionSchema.nullable(),
        macros: coachContextSchema.shape.today.shape.macros,
        nutritionTargets: coachContextSchema.shape.today.shape.nutritionTargets,
      }),
      progress: coachContextSchema.shape.progress,
    }),
    messages: z
      .array(
        z.object({
          role: z.enum(['assistant', 'user']),
          content: z.string().trim().min(1).max(1000),
        }),
      )
      .min(1)
      .max(8),
  })
  .refine(
    (data) => data.messages.at(-1)?.role === 'user',
    'The last message must be from the runner.',
  )
  .refine(
    (data) => data.messages.reduce((sum, message) => sum + message.content.length, 0) <= 4000,
    'Conversation is too long.',
  )
