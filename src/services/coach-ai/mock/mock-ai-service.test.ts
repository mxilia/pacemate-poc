import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { RunnerProfile } from '@/types/coach-ai'
import {
  coachContextSchema,
  coachRequestSchema,
  coachResponseSchema,
  nutritionRequestSchema,
  nutritionResponseSchema,
} from '@/features/running-coach/schema'
import { buildCoachContext } from '@/features/running-coach/coach-context'
import { getMockDashboardData, mockAIService } from './mock-ai-service'

const profile: RunnerProfile = {
  health: { weightKg: '70', heightCm: '175', age: '30', medicalConditions: '' },
  goal: 'First 10K',
  level: 'Beginner',
  currentAbility: 'I can run 7 km',
  schedule: { daysPerWeek: '3', days: ['Monday', 'Wednesday', 'Saturday'], time: 'Morning' },
  trainingLoad: 'Balanced',
  consistencyBlocker: 'Busy weekdays',
  partnerPreference: { ageRange: '25-40', level: 'Any level', gender: 'No preference' },
}
const now = new Date(2026, 9, 6, 12)
const loggedMeal = { name: 'Logged food', type: 'Lunch', carbs: 65, fat: 12, protein: 24 }

test('next session skips today and future runs do not inflate progress', () => {
  const monday = new Date(2026, 9, 5, 12)
  const session = (day: string) => ({
    day,
    title: 'Easy Run',
    distanceKm: 3,
    intensity: 'Easy',
    note: 'Easy',
  })
  const context = buildCoachContext({
    profile,
    plan: {
      headline: 'Plan',
      summary: '',
      weeklyDistanceKm: 6,
      sessions: [session('Monday'), session('Wednesday')],
      recoveryTips: [],
      weeklyCoachNote: '',
    },
    runs: [{ date: new Date(2026, 9, 6, 12).toISOString(), distanceKm: 50, seconds: 300 }],
    meals: [],
    now: monday,
  })
  assert.equal(context.today.session?.day, 'Monday')
  assert.equal(context.today.nextSession?.day, 'Wednesday')
  assert.equal(context.progress.runsThisWeek, 0)
  assert.equal(context.progress.streakDays, 0)
  assert.equal(context.progress.longestRunKm, 7)
})

test('generated plans respect one available day instead of imposing a two-day minimum', async () => {
  const plan = await mockAIService.generateRunningPlan({
    ...profile,
    schedule: { daysPerWeek: '1', days: ['Saturday'], time: 'Morning' },
  })
  assert.equal(plan.sessions.length, 1)
  assert.equal(plan.sessions[0].day, 'Saturday')
  assert.equal(plan.weeklyDistanceKm, plan.sessions[0].distanceKm)
})

test('partner suggestions respect age and gender preferences', async () => {
  const matches = await mockAIService.suggestPartners({
    ...profile,
    partnerPreference: { ...profile.partnerPreference, ageRange: '25-30', gender: 'Women' },
  })
  assert.deepEqual(
    matches.map((partner) => partner.name),
    ['Maya'],
  )
  const none = await mockAIService.suggestPartners({
    ...profile,
    partnerPreference: { ...profile.partnerPreference, ageRange: '40-50', gender: 'Men' },
  })
  assert.deepEqual(none, [])
})

test('nutrition chat returns JSON macro estimates and updates the shared coach context', async () => {
  const demo = getMockDashboardData(now)
  const context = buildCoachContext({
    profile,
    plan: null,
    runs: [],
    meals: [],
    macroTotals: demo.nutrition.consumed,
    now,
  })
  const response = await mockAIService.processNutrition(
    JSON.parse(JSON.stringify({ context, message: 'I ate 100g rice and 2 eggs' })),
  )
  assert.equal(response.status, 'logged')
  assert.deepEqual(response.meal, {
    name: '100g rice, 2 egg',
    type: 'Food log',
    carbs: 29.2,
    protein: 15.3,
    fat: 10.3,
  })
  const updated = buildCoachContext({
    profile,
    plan: null,
    runs: [],
    meals: [response.meal!],
    macroTotals: { carbs: 209.2, protein: 93.3, fat: 52.3 },
    now,
  })
  const coach = await mockAIService.generateCoachResponse({
    context: updated,
    messages: [{ role: 'user', content: 'How to fuel?' }],
  })
  assert.match(coach.message.content, /209.2 g carbs/)
  assert.deepEqual(updated.today.nutritionTargets, context.today.nutritionTargets)
})

test('nutrition chat rejects malformed boundaries and clarifies ambiguous food without partial logging', async () => {
  assert.equal(nutritionRequestSchema.safeParse({ context: {}, message: '' }).success, false)
  assert.equal(
    nutritionResponseSchema.safeParse({
      version: '1.0',
      status: 'logged',
      message: 'ok',
      meal: null,
    }).success,
    false,
  )
  const context = buildCoachContext({ profile, plan: null, runs: [], meals: [], now })
  for (const message of ['rice', '100g rice and pizza', '0 eggs', '2g eggs', '-2 eggs']) {
    const result = await mockAIService.processNutrition({ context, message })
    assert.equal(result.status, 'needs_clarification')
    assert.equal(result.meal, null)
  }
  const result = await mockAIService.processNutrition({ context, message: '250ml milk, 40g oats' })
  assert.equal(result.status, 'logged')
  assert.equal(result.meal?.carbs, 38.4)
})

test('JSON dashboard fixture produces a six-month chart, a 3-day streak, and 2/3 weekly runs', () => {
  const demo = getMockDashboardData(new Date('2026-10-06T05:00:00Z'))
  const context = buildCoachContext({
    profile,
    plan: null,
    runs: demo.runs,
    meals: [],
    macroTotals: demo.nutrition.consumed,
    weeklyRunTarget: demo.weeklyRunTarget,
    now,
  })
  assert.equal(new Set(demo.runs.map((run) => run.date.slice(0, 7))).size, 6)
  assert.equal(context.progress.streakDays, 3)
  assert.equal(context.progress.runsThisWeek, 2)
  assert.equal(context.progress.weeklyRunTarget, 3)
  assert.equal(context.progress.goalPercent, 70)
  assert.deepEqual(context.today.macros, { carbs: 180, fat: 42, protein: 78 })
  assert.deepEqual(context.today.nutritionTargets, {
    carbs: 280,
    fat: 70,
    protein: 120,
    caloriesKcal: 2230,
  })
  assert.deepEqual(coachContextSchema.parse(JSON.parse(JSON.stringify(context))), context)
})

test('JSON context uses logged runs, local week boundaries, meals, and the starting distance', () => {
  const context = buildCoachContext({
    profile,
    plan: null,
    now,
    meals: [loggedMeal],
    runs: [
      { date: new Date(2026, 9, 4, 8).toISOString(), distanceKm: 5, seconds: 1800 },
      { date: new Date(2026, 9, 5, 8).toISOString(), distanceKm: 6, seconds: 2100 },
      { date: new Date(2026, 9, 6, 8).toISOString(), distanceKm: 7, seconds: 2400 },
    ],
  })
  assert.deepEqual(coachContextSchema.parse(JSON.parse(JSON.stringify(context))), context)
  assert.equal(context.progress.runsThisWeek, 2)
  assert.equal(context.progress.distanceThisWeekKm, 13)
  assert.equal(context.progress.streakDays, 3)
  assert.equal(context.progress.goalPercent, 70)
  assert.deepEqual(context.today.macros, { carbs: 65, fat: 12, protein: 24 })
  assert.equal(context.today.date, '2026-10-06')
})

test('non-distance goals and unknown starting ability remain empty rather than invented', () => {
  const context = buildCoachContext({
    profile: { ...profile, goal: 'Run consistently', currentAbility: 'Just starting' },
    plan: null,
    runs: [],
    meals: [],
    now,
  })
  assert.equal(context.progress.targetDistanceKm, null)
  assert.equal(context.progress.goalPercent, null)
  assert.equal(context.progress.longestRunKm, 0)
  assert.equal(context.today.session, null)
})

test('request and response schemas reject malformed AI boundaries', () => {
  assert.equal(coachRequestSchema.safeParse({ context: {}, messages: [] }).success, false)
  assert.equal(
    coachResponseSchema.safeParse({
      version: '1.0',
      message: { role: 'user', content: '' },
      suggestedReplies: [],
    }).success,
    false,
  )
})

test('coach responses reflect the latest JSON meal context and preserve conversation', async () => {
  const context = buildCoachContext({
    profile,
    plan: null,
    runs: [],
    meals: [loggedMeal],
    now,
  })
  const request = coachRequestSchema.parse({
    context,
    messages: [
      { role: 'assistant', content: context.dailyAdvice },
      { role: 'user', content: 'How to fuel?' },
    ],
  })
  const response = await mockAIService.generateCoachResponse(JSON.parse(JSON.stringify(request)))
  assert.equal(response.message.role, 'assistant')
  assert.match(response.message.content, /65 g carbs/)
  assert.match(response.message.content, /24 g protein/)
  assert.equal(request.messages.length, 2)
  await assert.rejects(
    mockAIService.generateCoachResponse({
      context,
      messages: [{ role: 'assistant', content: 'Invalid last turn' }],
    }),
  )
})
