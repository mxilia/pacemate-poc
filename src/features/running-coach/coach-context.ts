import type {
  RunnerProfile,
  RunningPlan,
  CompletedRun,
  MealLog,
  CoachContext,
  CoachChatRequest,
  CompactCoachRequest,
} from '@/types/coach-ai'
import { coachContextSchema, compactCoachRequestSchema } from './schema'
import { DEFAULT_NUTRITION_TARGETS } from './const'

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const getBaselineDistanceKm = (ability: string) => {
  const match = ability.match(/(\d+(?:\.\d+)?)\s*(?:km|k\b|kilomet(?:er|re)s?)/i)
  return match ? Number(match[1]) : 0
}

export function buildCoachContext({
  profile,
  plan,
  runs,
  meals,
  macroTotals,
  weeklyRunTarget,
  now = new Date(),
}: {
  profile: RunnerProfile
  plan: RunningPlan | null
  runs: CompletedRun[]
  meals: MealLog[]
  macroTotals?: CoachContext['today']['macros']
  weeklyRunTarget?: number
  now?: Date
}): CoachContext {
  const day = weekDays[(now.getDay() + 6) % 7]
  const session = plan?.sessions.find((item) => item.day === day) ?? null
  const nextSession =
    plan?.sessions
      .slice()
      .sort(
        (a, b) =>
          ((weekDays.indexOf(a.day) - weekDays.indexOf(day) + 7) % 7 || 7) -
          ((weekDays.indexOf(b.day) - weekDays.indexOf(day) + 7) % 7 || 7),
      )[0] ?? null
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  )
  const weekRuns = runs.filter(
    (run) => new Date(run.date) >= weekStart && new Date(run.date) <= now,
  )
  const pastRuns = runs.filter((run) => new Date(run.date) <= now)
  const completedDays = new Set(pastRuns.map((run) => dateKey(new Date(run.date))))
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!completedDays.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streakDays = 0
  while (completedDays.has(dateKey(cursor))) {
    streakDays++
    cursor.setDate(cursor.getDate() - 1)
  }
  const longestRunKm = Math.max(
    getBaselineDistanceKm(profile.currentAbility),
    ...pastRuns.map((run) => run.distanceKm),
    0,
  )
  const targetDistanceKm =
    profile.goal === 'First 5K' ? 5 : profile.goal === 'First 10K' ? 10 : null
  const dailyAdvice = !plan
    ? 'Tell me about your running and we will build a week that works for you.'
    : session
      ? `Today: ${session.distanceKm} km ${session.title.toLowerCase()}. ${session.note}`
      : `Rest day today. A gentle walk and mobility are enough. Your next run is ${nextSession?.day ?? 'still to be scheduled'}.`
  return coachContextSchema.parse({
    version: '1.0',
    generatedAt: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    profile,
    plan,
    runs,
    today: {
      date: dateKey(now),
      day,
      session,
      nextSession,
      meals,
      nutritionTargets: DEFAULT_NUTRITION_TARGETS,
      macros:
        macroTotals ??
        meals.reduce(
          (sum, meal) => ({
            carbs: sum.carbs + meal.carbs,
            fat: sum.fat + meal.fat,
            protein: sum.protein + meal.protein,
          }),
          { carbs: 0, fat: 0, protein: 0 },
        ),
    },
    progress: {
      streakDays,
      runsThisWeek: weekRuns.length,
      weeklyRunTarget: weeklyRunTarget ?? plan?.sessions.length ?? 0,
      distanceThisWeekKm: Number(weekRuns.reduce((sum, run) => sum + run.distanceKm, 0).toFixed(2)),
      longestRunKm,
      targetDistanceKm,
      goalPercent: targetDistanceKm
        ? Math.min(100, Math.round((longestRunKm / targetDistanceKm) * 100))
        : null,
    },
    dailyAdvice,
  })
}

export function compactCoachRequest({ context, messages }: CoachChatRequest): CompactCoachRequest {
  const { profile, plan, today, progress } = context
  const session = (value: NonNullable<typeof today.session>) => ({
    day: value.day,
    title: value.title.slice(0, 60),
    distanceKm: value.distanceKm,
  })
  let remaining = 4000
  const recent = messages
    .slice(-8)
    .reverse()
    .flatMap((message) => {
      const content = message.content.slice(0, Math.min(1000, remaining)).trim()
      remaining -= content.length
      return content ? [{ role: message.role, content }] : []
    })
    .reverse()
  return compactCoachRequestSchema.parse({
    context: {
      date: today.date,
      timezone: context.timezone,
      profile: {
        health: {
          weightKg: profile.health.weightKg.slice(0, 16),
          heightCm: profile.health.heightCm.slice(0, 16),
          age: profile.health.age.slice(0, 16),
          medicalConditions: profile.health.medicalConditions.slice(0, 240),
        },
        goal: profile.goal,
        level: profile.level,
        currentAbility: profile.currentAbility.slice(0, 200),
        preferredTime: profile.schedule.time.slice(0, 30),
        trainingLoad: profile.trainingLoad,
        consistencyBlocker: profile.consistencyBlocker.slice(0, 200),
      },
      plan: plan
        ? {
            weeklyDistanceKm: plan.weeklyDistanceKm,
            sessions: plan.sessions.slice(0, 7).map(session),
          }
        : null,
      today: {
        session: today.session ? session(today.session) : null,
        nextSession: today.nextSession ? session(today.nextSession) : null,
        macros: today.macros,
        nutritionTargets: today.nutritionTargets,
      },
      progress,
    },
    messages: recent,
  })
}
