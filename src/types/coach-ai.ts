export type RunningGoal =
  'First 5K' | 'First 10K' | 'Improve pace' | 'Run consistently' | 'General fitness'
export type RunningLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type TrainingLoad = 'Easy / sustainable' | 'Balanced' | 'Push me'
export type PartnerGenderPreference = 'No preference' | 'Women' | 'Men' | 'Mixed group'

export interface RunnerProfile {
  health: {
    weightKg: string
    heightCm: string
    age: string
    medicalConditions: string
  }
  goal: RunningGoal
  level: RunningLevel
  currentAbility: string
  schedule: {
    daysPerWeek: string
    days: string[]
    time: string
  }
  trainingLoad: TrainingLoad
  consistencyBlocker: string
  partnerPreference: {
    ageRange: string
    level: RunningLevel | 'Any level'
    gender: PartnerGenderPreference
  }
}

export interface TrainingSession {
  day: string
  title: string
  distanceKm: number
  intensity: string
  note: string
}

export interface RunningPlan {
  headline: string
  summary: string
  weeklyDistanceKm: number
  sessions: TrainingSession[]
  recoveryTips: string[]
  weeklyCoachNote: string
}

export interface RunAnalysis {
  distanceKm: number
  time: string
  pace: string
  coachNote: string
  nextStep: string
}

export interface PartnerMatch {
  name: string
  age: number
  level: string
  matchScore: number
  time: string
  note: string
}

export interface AIService {
  processNutrition(request: NutritionChatRequest): Promise<NutritionChatResponse>
  generateCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse>
  generateOnboardingResponse(profile: RunnerProfile, stepIndex: number): Promise<string>
  generateRunningPlan(profile: RunnerProfile): Promise<RunningPlan>
  analyzeRun(profile: RunnerProfile, distanceKm: number, seconds: number): Promise<RunAnalysis>
  suggestPartners(profile: RunnerProfile): Promise<PartnerMatch[]>
}

export interface CompletedRun {
  date: string
  distanceKm: number
  seconds: number
  analysis?: RunAnalysis
}
export interface MealLog {
  name: string
  type: string
  carbs: number
  fat: number
  protein: number
}
export interface CoachMessage {
  role: 'assistant' | 'user'
  content: string
}
export interface CoachContext {
  version: '1.0'
  generatedAt: string
  timezone: string
  profile: RunnerProfile
  plan: RunningPlan | null
  runs: CompletedRun[]
  today: {
    date: string
    day: string
    session: TrainingSession | null
    nextSession: TrainingSession | null
    meals: MealLog[]
    macros: { carbs: number; fat: number; protein: number }
    nutritionTargets: { carbs: number; fat: number; protein: number; caloriesKcal: number }
  }
  progress: {
    streakDays: number
    runsThisWeek: number
    weeklyRunTarget: number
    distanceThisWeekKm: number
    longestRunKm: number
    targetDistanceKm: number | null
    goalPercent: number | null
  }
  dailyAdvice: string
}
export interface CoachChatRequest {
  context: CoachContext
  messages: CoachMessage[]
}
export interface CompactCoachRequest {
  context: {
    date: string
    timezone: string
    profile: Pick<
      RunnerProfile,
      'health' | 'goal' | 'level' | 'currentAbility' | 'trainingLoad' | 'consistencyBlocker'
    > & { preferredTime: string }
    plan: {
      weeklyDistanceKm: number
      sessions: Array<Pick<TrainingSession, 'day' | 'title' | 'distanceKm'>>
    } | null
    today: Pick<CoachContext['today'], 'macros' | 'nutritionTargets'> & {
      session: Pick<TrainingSession, 'day' | 'title' | 'distanceKm'> | null
      nextSession: Pick<TrainingSession, 'day' | 'title' | 'distanceKm'> | null
    }
    progress: CoachContext['progress']
  }
  messages: CoachMessage[]
}
export interface CoachChatResponse {
  version: '1.0'
  message: CoachMessage & { role: 'assistant' }
  suggestedReplies: string[]
}

export interface NutritionChatRequest {
  context: CoachContext
  message: string
}
export interface NutritionChatResponse {
  version: '1.0'
  status: 'logged' | 'needs_clarification'
  message: string
  meal: MealLog | null
}
