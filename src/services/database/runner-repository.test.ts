import assert from 'node:assert/strict'
import { test } from 'node:test'
import example from '../../../docs/pacemate-coach-context.example.json'
import { coachContextSchema } from '@/features/running-coach/schema'
import {
  activeSessionKey,
  createRunnerData,
  readRunnerData,
  runnerStorageKey,
  saveRunnerData,
  readActiveSession,
  saveActiveSession,
  clearActiveSession,
} from './runner-repository'
import { runnerDataSchema, userSessionSchema } from '@/features/running-coach/storage-schema'
import { getNutritionForDate } from '@/features/running-coach/nutrition'

const profile = coachContextSchema.parse(example.context).profile
const memoryStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

test('session repository validates login and signs out without deleting saved runner data', () => {
  const storage = memoryStorage()
  const data = createRunnerData(profile)
  assert.equal(saveRunnerData(storage, 'runner@example.com', data), true)
  assert.equal(readActiveSession(storage), null)
  saveActiveSession(storage, { name: ' Runner ', email: 'RUNNER@example.com' })
  assert.deepEqual(readActiveSession(storage), { name: 'Runner', email: 'runner@example.com' })
  clearActiveSession(storage)
  assert.equal(readActiveSession(storage), null)
  assert.deepEqual(readRunnerData(storage, 'runner@example.com'), data)
  assert.throws(() => saveActiveSession(storage, { name: '', email: 'invalid' }))
  assert.throws(() => readActiveSession(null))
  assert.throws(() => saveActiveSession(null, { name: 'Runner', email: 'runner@example.com' }))
  assert.throws(() => clearActiveSession(null))
  storage.setItem(activeSessionKey, '{broken')
  assert.throws(() => readActiveSession(storage))
})

test('runner records round-trip profile, plan, history, food logs and coach messages', () => {
  const storage = memoryStorage()
  const data = createRunnerData(profile)
  data.plan = example.context.plan
  data.hasCompletedOnboarding = true
  data.step = 7
  data.mealLogs.push({
    date: data.nutrition.date,
    meal: { name: 'Egg', type: 'Food log', carbs: 0.6, protein: 6.3, fat: 5 },
  })
  data.coachMessages.push({ role: 'user', content: 'How to fuel?' })
  data.user = { name: 'Runner', email: 'runner@example.com' }
  data.invitedPartners = ['Maya']
  data.runDraft = { distanceKm: 1.2, seconds: 360 }
  data.nutritionMessages = [
    { date: data.nutrition.date, role: 'assistant', content: 'Food logged.' },
  ]
  data.runs.push({
    date: new Date().toISOString(),
    distanceKm: 1.2,
    seconds: 360,
    analysis: {
      distanceKm: 1.2,
      time: '6:00',
      pace: '5:00',
      coachNote: 'Good run',
      nextStep: 'Rest',
    },
  })
  assert.equal(saveRunnerData(storage, 'RUNNER@example.com', data), true)
  assert.deepEqual(readRunnerData(storage, 'runner@example.com'), data)
  assert.equal(readRunnerData(storage, 'other@example.com'), null)
  storage.setItem(activeSessionKey, 'active')
  storage.removeItem(activeSessionKey)
  assert.deepEqual(readRunnerData(storage, 'runner@example.com'), data)
  assert.equal(readRunnerData(storage, 'runner@example.com')?.runs.length, data.runs.length)
})

test('malformed or blocked storage fails safely without mutating another record', () => {
  const storage = memoryStorage()
  storage.setItem(runnerStorageKey('broken@example.com'), '{oops')
  assert.equal(readRunnerData(storage, 'broken@example.com'), null)
  storage.setItem(runnerStorageKey('broken@example.com'), JSON.stringify({ version: '1.0' }))
  assert.equal(readRunnerData(storage, 'broken@example.com'), null)
  const blocked = {
    ...storage,
    setItem: () => {
      throw new Error('Quota exceeded')
    },
  }
  assert.equal(saveRunnerData(blocked, 'runner@example.com', createRunnerData(profile)), false)
  assert.equal(saveRunnerData(null, 'runner@example.com', createRunnerData(profile)), false)
  assert.equal(readRunnerData(null, 'runner@example.com'), null)
  assert.equal(saveRunnerData(storage, 'broken@example.com', createRunnerData(profile)), false)
  assert.equal(
    storage.getItem(runnerStorageKey('broken@example.com')),
    JSON.stringify({ version: '1.0' }),
  )
})

test('existing records migrate with safe defaults without losing history', () => {
  const data = createRunnerData(profile)
  const { user, invitedPartners, runDraft, nutritionMessages, ...legacy } = data
  void user
  void invitedPartners
  void runDraft
  void nutritionMessages
  const migrated = runnerDataSchema.parse(legacy)
  assert.deepEqual(migrated.runs, data.runs)
  assert.deepEqual(migrated.invitedPartners, [])
  assert.deepEqual(migrated.nutritionMessages, [])
  assert.equal(migrated.runDraft, null)
  assert.equal(migrated.user, null)
  assert.deepEqual(userSessionSchema.parse({ name: ' Runner ', email: 'RUNNER@example.com' }), {
    name: 'Runner',
    email: 'runner@example.com',
  })
})

test('daily nutrition includes each dated meal once and does not carry intake to tomorrow', () => {
  const data = createRunnerData(profile)
  data.nutrition.date = '2026-10-06'
  data.nutrition.consumed = { carbs: 10, protein: 20, fat: 5 }
  data.mealLogs = [
    {
      date: '2026-10-06',
      meal: { name: 'Egg', type: 'Food log', carbs: 0.6, protein: 6.3, fat: 5 },
    },
    {
      date: '2026-10-07',
      meal: { name: 'Rice', type: 'Food log', carbs: 28, protein: 2.7, fat: 0.3 },
    },
  ]
  assert.deepEqual(getNutritionForDate(data, '2026-10-06').macros, {
    carbs: 10.6,
    protein: 26.3,
    fat: 10,
  })
  assert.deepEqual(getNutritionForDate(data, '2026-10-07').macros, {
    carbs: 28,
    protein: 2.7,
    fat: 0.3,
  })
  assert.deepEqual(getNutritionForDate(data, '2026-10-08').macros, { carbs: 0, protein: 0, fat: 0 })
  assert.equal(data.mealLogs.length, 2)
})

test('saved assistant replies drop legacy demo notes without editing user messages', () => {
  const storage = memoryStorage()
  const data = createRunnerData(profile)
  data.coachMessages = [
    { role: 'user', content: 'These are sample targets for the demo.' },
    {
      role: 'assistant',
      content: "Today's demo targets are 280 g carbs. These are sample targets for the demo.",
    },
  ]
  data.nutritionMessages = [
    {
      date: data.nutrition.date,
      role: 'assistant',
      content: 'Logged 1 egg. Demo estimates; daily targets stay unchanged.',
    },
  ]
  assert.equal(saveRunnerData(storage, 'runner@example.com', data), true)
  const restored = readRunnerData(storage, 'runner@example.com')!
  assert.equal(restored.coachMessages[0].content, data.coachMessages[0].content)
  assert.equal(restored.coachMessages[1].content, "Today's targets are 280 g carbs.")
  assert.equal(restored.nutritionMessages[0].content, 'Logged 1 egg.')
})
