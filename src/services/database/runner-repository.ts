import { runnerDataSchema, userSessionSchema } from '@/features/running-coach/storage-schema'
import { getMockDashboardData } from '@/services/coach-ai/mock/mock-ai-service'
import type { RunnerProfile } from '@/types/coach-ai'
import type { RunnerData, StorageAccess, UserSession } from '@/types/runner'

export const activeSessionKey = 'ai-running-coach-session'

export function readActiveSession(storage: StorageAccess | null): UserSession | null {
  if (!storage) throw new Error('Storage is unavailable')
  const raw = storage.getItem(activeSessionKey)
  return raw ? userSessionSchema.parse(JSON.parse(raw)) : null
}

export function saveActiveSession(storage: StorageAccess | null, session: UserSession): void {
  if (!storage) throw new Error('Storage is unavailable')
  storage.setItem(activeSessionKey, JSON.stringify(userSessionSchema.parse(session)))
}

export function clearActiveSession(storage: StorageAccess | null): void {
  if (!storage) throw new Error('Storage is unavailable')
  storage.removeItem(activeSessionKey)
}

// Keep the legacy key so rebranding does not discard existing saved users.
export const runnerStorageKey = (email: string) =>
  `runnit-user:${encodeURIComponent(email.trim().toLowerCase())}`

export function createRunnerData(profile: RunnerProfile): RunnerData {
  const demo = getMockDashboardData()
  return {
    version: '1.0',
    user: null,
    invitedPartners: [],
    coachAdviceKey: '',
    runDraft: null,
    nutritionMessages: [],
    profile,
    plan: null,
    partners: [],
    runs: demo.runs,
    hasCompletedOnboarding: false,
    step: 0,
    messages: [],
    mealLogs: [],
    nutrition: { ...demo.nutrition, date: new Date().toLocaleDateString('sv-SE') },
    coachMessages: [],
  }
}

export function readRunnerData(storage: StorageAccess | null, email: string): RunnerData | null {
  try {
    const raw = storage?.getItem(runnerStorageKey(email))
    if (!raw) return null
    const data = runnerDataSchema.parse(JSON.parse(raw))
    const cleanAssistantCopy = (content: string) =>
      content
        .replace("Today's demo targets are", "Today's targets are")
        .replace(' These are sample targets for the demo.', '')
        .replace(' Demo estimates; daily targets stay unchanged.', '')
        .replace(
          'Nothing added for this entry. This demo supports rice, chicken, oats in grams; milk in ml; and eggs or bananas by count. Try: 100g rice and 2 eggs.',
          'Please include quantities: rice, chicken, or oats in grams; milk in ml; eggs or bananas by count.',
        )
    data.coachMessages = data.coachMessages.map((message) =>
      message.role === 'assistant'
        ? { ...message, content: cleanAssistantCopy(message.content) }
        : message,
    )
    data.nutritionMessages = data.nutritionMessages.map((message) =>
      message.role === 'assistant'
        ? { ...message, content: cleanAssistantCopy(message.content) }
        : message,
    )
    return data
  } catch {
    return null
  }
}

export function saveRunnerData(
  storage: StorageAccess | null,
  email: string,
  data: RunnerData,
): boolean {
  try {
    if (!storage) return false
    const existing = storage.getItem(runnerStorageKey(email))
    // Never replace an unreadable database record with freshly seeded demo data.
    if (existing && !runnerDataSchema.safeParse(JSON.parse(existing)).success) return false
    storage.setItem(runnerStorageKey(email), JSON.stringify(runnerDataSchema.parse(data)))
    return true
  } catch {
    return false
  }
}
