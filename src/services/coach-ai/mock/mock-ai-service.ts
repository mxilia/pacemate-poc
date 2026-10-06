import {
  coachRequestSchema,
  coachResponseSchema,
  nutritionRequestSchema,
  nutritionResponseSchema,
} from '@/features/running-coach/schema'
import dashboardFixture from './dashboard-data.json'
import nutritionFixture from './nutrition-data.json'
import type {
  AIService,
  RunnerProfile,
  CompletedRun,
  CoachChatRequest,
  CoachChatResponse,
  NutritionChatRequest,
  NutritionChatResponse,
} from '@/types/coach-ai'

export function getMockDashboardData(now = new Date()) {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const year = bangkok.getUTCFullYear()
  const month = bangkok.getUTCMonth()
  const day = bangkok.getUTCDate()
  const historicalRuns: CompletedRun[] = dashboardFixture.monthlyProgression.map((point) => ({
    date: new Date(Date.UTC(year, month - point.monthsAgo, 1, 0)).toISOString(),
    distanceKm: point.distanceKm,
    seconds: Math.round(point.distanceKm * 390),
  }))
  const recentRuns: CompletedRun[] = dashboardFixture.recentRuns.map((run) => ({
    date: new Date(Date.UTC(year, month, day - run.daysAgo, 0)).toISOString(),
    distanceKm: run.distanceKm,
    seconds: run.seconds,
  }))
  return {
    version: dashboardFixture.version,
    timezone: dashboardFixture.timezone,
    runs: [...historicalRuns, ...recentRuns].filter((run) => new Date(run.date) <= now),
    weeklyRunTarget: dashboardFixture.weeklyRunTarget,
    nutrition: dashboardFixture.nutrition,
  }
}
const pause = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const fallbackDays = ['Monday', 'Wednesday', 'Saturday', 'Sunday']

const getBaseDistance = (profile: RunnerProfile) => {
  const levelBase = profile.level === 'Advanced' ? 6 : profile.level === 'Intermediate' ? 4.5 : 2.8
  const goalBoost = profile.goal === 'First 10K' ? 1.4 : profile.goal === 'Improve pace' ? 0.8 : 0
  const loadBoost =
    profile.trainingLoad === 'Push me'
      ? 0.7
      : profile.trainingLoad === 'Easy / sustainable'
        ? -0.4
        : 0

  return Math.max(2, levelBase + goalBoost + loadBoost)
}

const formatRunTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainder}`
}

const formatPace = (distanceKm: number, seconds: number) => {
  const paceSeconds = Math.round(seconds / Math.max(distanceKm, 0.1))
  const minutes = Math.floor(paceSeconds / 60)
  const remainder = String(paceSeconds % 60).padStart(2, '0')

  return `${minutes}:${remainder} /km`
}

export class MockAIService implements AIService {
  async processNutrition(request: NutritionChatRequest): Promise<NutritionChatResponse> {
    const { message } = nutritionRequestSchema.parse(request)
    await pause(450)
    const parts = message
      .toLowerCase()
      .replace(/^(i (ate|had)|ate|had)\s+/, '')
      .split(/\s*(?:,|\+|\band\b)\s*/)
    const totals = { carbs: 0, protein: 0, fat: 0 }
    const descriptions: string[] = []
    for (const part of parts) {
      const match = part.match(/^(\d+(?:\.\d+)?)\s*(g|grams?|ml)?\s+(.+)$/)
      const quantity = Number(match?.[1])
      const unit = match?.[2]?.replace(/grams?/, 'g') ?? 'each'
      const food = nutritionFixture.foods.find((item) =>
        item.aliases.includes(match?.[3]?.trim() ?? ''),
      )
      if (
        !food ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > 5000 ||
        unit !== food.unit
      ) {
        return nutritionResponseSchema.parse({
          version: '1.0',
          status: 'needs_clarification',
          meal: null,
          message:
            'Please include quantities: rice, chicken, or oats in grams; milk in ml; eggs or bananas by count.',
        })
      }
      const scale = quantity / food.amount
      for (const macro of ['carbs', 'protein', 'fat'] as const) totals[macro] += food[macro] * scale
      descriptions.push(`${quantity}${unit === 'each' ? '' : unit} ${food.name.toLowerCase()}`)
    }
    const meal = {
      name: descriptions.join(', '),
      type: 'Food log',
      carbs: Math.round(totals.carbs * 10) / 10,
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    }
    return nutritionResponseSchema.parse({
      version: '1.0',
      status: 'logged',
      meal,
      message: `Logged ${meal.name}: +${meal.carbs}g carbs, +${meal.protein}g protein, +${meal.fat}g fat.`,
    })
  }
  async generateCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
    const { context, messages } = coachRequestSchema.parse(request)
    if (messages[messages.length - 1].role !== 'user')
      throw new Error('The last chat message must be from the runner.')
    await pause(450)
    const question = messages[messages.length - 1].content.toLowerCase()
    const { profile, plan, progress, today } = context
    const content = /food|eat|carb|protein|meal|fuel/.test(question)
      ? `Today's targets are ${today.nutritionTargets.carbs} g carbs, ${today.nutritionTargets.protein} g protein, and ${today.nutritionTargets.fat} g fat (${today.nutritionTargets.caloriesKcal} kcal). You have logged ${today.macros.carbs} g carbs, ${today.macros.protein} g protein, and ${today.macros.fat} g fat so far.`
      : /tired|rest|sore|recover/.test(question)
        ? `You have completed ${progress.runsThisWeek} runs this week. ${today.session ? 'If you feel tired, keep today easy or take a recovery day.' : 'Today is already a rest day in your plan.'} Check in with your energy before your next run.`
        : /week|plan|schedule/.test(question)
          ? plan
            ? `Your plan has ${plan.sessions.length} runs and ${plan.weeklyDistanceKm} km this week, usually in the ${profile.schedule.time.toLowerCase()}. You have completed ${progress.runsThisWeek} so far. ${plan.weeklyCoachNote}`
            : 'Complete your running profile to build your first week.'
          : /goal|progress|distance/.test(question)
            ? progress.targetDistanceKm
              ? `Your longest distance is ${progress.longestRunKm} km, ${progress.goalPercent}% of your ${progress.targetDistanceKm} km goal. Keep your next sessions controlled and build gradually.`
              : `Your current goal is ${profile.goal.toLowerCase()}. You have completed ${progress.runsThisWeek} runs this week.`
            : context.dailyAdvice
    return coachResponseSchema.parse({
      version: '1.0',
      message: { role: 'assistant', content },
      suggestedReplies: ['This week', 'My goal progress', 'How to fuel?'],
    })
  }
  async generateOnboardingResponse(profile: RunnerProfile, stepIndex: number) {
    await pause(350)

    if (stepIndex === 1) {
      return 'Thanks. Health context helps me keep the first week ambitious but sensible.'
    }

    if (stepIndex === 2 && profile.goal === 'First 10K') {
      return 'A 10K goal needs patience and a calm long run. I will build that in.'
    }

    if (stepIndex === 3 && profile.level === 'Beginner') {
      return 'Beginner is totally fine. The plan will favor consistency before speed.'
    }

    if (stepIndex === 6) {
      return 'Good. I will keep your schedule realistic and give you a backup option for busy days.'
    }

    return 'Got it. I am using that answer to shape the next recommendation.'
  }

  async generateRunningPlan(profile: RunnerProfile) {
    await pause(850)

    const requestedDays = Number.parseInt(profile.schedule.daysPerWeek, 10) || 3
    const runDays = Math.min(Math.max(requestedDays, 1), 7)
    const selectedDays = (
      profile.schedule.days.length > 0 ? [...new Set(profile.schedule.days)] : fallbackDays
    ).slice(0, runDays)
    const baseDistance = getBaseDistance(profile)
    const needsLongRun = profile.goal === 'First 10K' || profile.goal === 'Run consistently'
    const needsSpeed = profile.goal === 'Improve pace' || profile.trainingLoad === 'Push me'

    const sessions = selectedDays.map((day, index) => {
      const isLast = index === selectedDays.length - 1
      const isTempo = needsSpeed && index === 1
      const distanceKm = Number(
        (baseDistance * (isLast && needsLongRun ? 1.45 : isTempo ? 0.85 : 1)).toFixed(1),
      )

      return {
        day,
        title: isLast && needsLongRun ? 'Long Easy Run' : isTempo ? 'Tempo Builder' : 'Easy Run',
        distanceKm,
        intensity: isTempo
          ? 'Moderate'
          : profile.trainingLoad === 'Push me' && !isLast
            ? 'Steady'
            : 'Easy',
        note: isTempo
          ? 'Warm up first, then hold a controlled effort for the middle section.'
          : isLast && needsLongRun
            ? 'Keep this relaxed. The target is confidence, not exhaustion.'
            : 'Stay conversational and finish feeling like you could do a little more.',
      }
    })

    return {
      headline: `${profile.goal} plan for a ${profile.level.toLowerCase()} runner`,
      summary: `${sessions.length} runs per week, usually in the ${profile.schedule.time.toLowerCase()}, with a ${profile.trainingLoad.toLowerCase()} training feel.`,
      weeklyDistanceKm: Number(
        sessions.reduce((total, session) => total + session.distanceKm, 0).toFixed(1),
      ),
      sessions,
      recoveryTips: [
        'Take one full rest day after your longest run.',
        'Use 6 minutes of calf, hip, and hamstring mobility after each run.',
        profile.health.medicalConditions.trim()
          ? 'Keep intensity conservative if symptoms appear, and do not push through warning pain.'
          : 'If soreness changes your stride, swap the next run for a walk.',
      ],
      weeklyCoachNote:
        profile.consistencyBlocker.trim().length > 0
          ? `When "${profile.consistencyBlocker}" gets in the way, do a 15-minute easy run instead of skipping completely.`
          : 'Your backup plan is a 15-minute easy run. Small wins still count.',
    }
  }

  async analyzeRun(profile: RunnerProfile, distanceKm: number, seconds: number) {
    await pause(550)

    return {
      distanceKm: Number(distanceKm.toFixed(2)),
      time: formatRunTime(seconds),
      pace: formatPace(distanceKm, seconds),
      coachNote:
        profile.trainingLoad === 'Push me'
          ? 'Strong effort. Let the next run be easy so today becomes fitness instead of fatigue.'
          : 'Nice controlled effort. This is the kind of run that makes consistency easier.',
      nextStep:
        profile.goal === 'First 10K'
          ? 'Next: recovery mobility today, easy run next session.'
          : 'Next: hydrate, stretch, then keep the next session relaxed.',
    }
  }

  async suggestPartners(profile: RunnerProfile) {
    await pause(450)

    const partnerLevel =
      profile.partnerPreference.level === 'Any level'
        ? `${profile.level}-friendly`
        : profile.partnerPreference.level

    const candidates = [
      {
        name: 'Maya',
        age: 29,
        level: partnerLevel,
        matchScore: 94,
        time: profile.schedule.time,
        note: `Also working toward ${profile.goal.toLowerCase()} and likes conversational pacing.`,
      },
      {
        name: 'Narin',
        age: 34,
        level: partnerLevel,
        matchScore: 88,
        time: profile.schedule.time === 'Morning' ? 'Early morning' : profile.schedule.time,
        note: 'Reliable weekday runner with a strong schedule match.',
      },
    ]
    const [minAge, maxAge] = profile.partnerPreference.ageRange.split('-').map(Number)
    return candidates.filter(
      (partner) =>
        partner.age >= minAge &&
        partner.age <= maxAge &&
        (profile.partnerPreference.gender === 'Women'
          ? partner.name === 'Maya'
          : profile.partnerPreference.gender === 'Men'
            ? partner.name === 'Narin'
            : true),
    )
  }
}

export const mockAIService = new MockAIService()
