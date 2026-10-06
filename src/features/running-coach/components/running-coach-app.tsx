'use client'

import { Check, ChevronRight, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { TrainingDashboard } from './training-dashboard'
import { RunningHeader } from './running-header'
import { WelcomePage } from './welcome-page'
import { SignInModal } from './sign-in-modal'
import { RunModal, type RunState } from './run-modal'
import { aiService } from '@/services/coach-ai/coach-service'
import {
  createRunnerData,
  readRunnerData,
  saveRunnerData,
  readActiveSession,
  saveActiveSession,
  clearActiveSession,
} from '@/services/database/runner-repository'
import { getBrowserStorage } from '@/lib/browser-storage'
import type { UserSession, RunnerData } from '@/types/runner'
import { validateOnboardingStep } from '@/features/running-coach/onboarding-schema'
import {
  type PartnerGenderPreference,
  type CompletedRun,
  type PartnerMatch,
  type RunAnalysis,
  type RunningGoal,
  type RunningLevel,
  type RunningPlan,
  type RunnerProfile,
  type TrainingLoad,
} from '@/types/coach-ai'

type Stage = 'landing' | 'login' | 'dashboard' | 'tracker' | 'summary'
type ChatMessage = { role: 'ai' | 'user'; text: string }

const goals: RunningGoal[] = [
  'First 5K',
  'First 10K',
  'Improve pace',
  'Run consistently',
  'General fitness',
]
const levels: RunningLevel[] = ['Beginner', 'Intermediate', 'Advanced']
const trainingLoads: TrainingLoad[] = ['Easy / sustainable', 'Balanced', 'Push me']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const times = ['Morning', 'Lunch break', 'Evening', 'Flexible']
const partnerLevels: Array<RunningLevel | 'Any level'> = [
  'Any level',
  'Beginner',
  'Intermediate',
  'Advanced',
]
const partnerGenders: PartnerGenderPreference[] = ['No preference', 'Women', 'Men', 'Mixed group']

const initialProfile: RunnerProfile = {
  health: {
    weightKg: '',
    heightCm: '',
    age: '',
    medicalConditions: '',
  },
  goal: 'First 10K',
  level: 'Beginner',
  currentAbility: '',
  schedule: {
    daysPerWeek: '3',
    days: ['Monday', 'Wednesday', 'Saturday'],
    time: 'Morning',
  },
  trainingLoad: 'Balanced',
  consistencyBlocker: '',
  partnerPreference: {
    ageRange: '25-40',
    level: 'Any level',
    gender: 'No preference',
  },
}

const onboarding = [
  'Health basics',
  'Running goal',
  'Current level',
  'Current ability',
  'Schedule',
  'Training feel',
  'Consistency',
  'Partner preference',
]

export const RunningCoachApp = () => {
  const [stage, setStage] = useState<Stage>('landing')
  const [session, setSession] = useState<UserSession | null>(null)
  const [profile, setProfile] = useState<RunnerProfile>(initialProfile)
  const [step, setStep] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Welcome in. I will ask one thing at a time, then build your first running week.',
    },
    {
      role: 'ai',
      text: getPrompt(0),
    },
  ])
  const [isThinking, setIsThinking] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [plan, setPlan] = useState<RunningPlan | null>(null)
  const [partners, setPartners] = useState<PartnerMatch[]>([])
  const [runs, setRuns] = useState<CompletedRun[]>([])
  const [mealLogs, setMealLogs] = useState<RunnerData['mealLogs']>([])
  const [nutrition, setNutrition] = useState<RunnerData['nutrition']>(
    () => createRunnerData(initialProfile).nutrition,
  )
  const [coachMessages, setCoachMessages] = useState<RunnerData['coachMessages']>([])
  const [invitedPartners, setInvitedPartners] = useState<string[]>([])
  const [coachAdviceKey, setCoachAdviceKey] = useState('')
  const [nutritionMessages, setNutritionMessages] = useState<RunnerData['nutritionMessages']>([])
  const [loadedEmail, setLoadedEmail] = useState<string | null>(null)
  const [storageError, setStorageError] = useState('')
  const [runState, setRunState] = useState<RunState>('ready')
  const [runSeconds, setRunSeconds] = useState(0)
  const [distanceKm, setDistanceKm] = useState(0)
  const [analysis, setAnalysis] = useState<RunAnalysis | null>(null)
  const [runError, setRunError] = useState('')
  const finishingRef = useRef(false)
  const [validationError, setValidationError] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const ownerRef = useRef<string | null>(null)

  const progress = useMemo(() => Math.round(((step + 1) / onboarding.length) * 100), [step])
  useEffect(() => {
    if (
      stage !== 'login' &&
      stage !== 'tracker' &&
      stage !== 'summary' &&
      (!isOnboardingOpen || stage !== 'dashboard')
    )
      return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOnboardingOpen, stage])
  useEffect(() => {
    let timeout: number | undefined
    try {
      const parsed = readActiveSession(getBrowserStorage())
      if (!parsed) return
      const data =
        readRunnerData(getBrowserStorage(), parsed.email) ?? createRunnerData(initialProfile)
      timeout = window.setTimeout(() => {
        ownerRef.current = parsed.email
        restoreData(data)
        setSession(parsed)
        setLoadedEmail(parsed.email)
        setStage('dashboard')
      }, 0)
    } catch {
      timeout = window.setTimeout(
        () => setStorageError('Could not restore your session. Please sign in again.'),
        0,
      )
    }

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
      }
    }
  }, [])

  useEffect(() => {
    if (!session || loadedEmail !== session.email) return
    const saved = saveRunnerData(getBrowserStorage(), session.email, {
      version: '1.0',
      user: session,
      invitedPartners,
      coachAdviceKey,
      nutritionMessages,
      runDraft: !analysis && runSeconds > 0 ? { distanceKm, seconds: runSeconds } : null,
      profile,
      plan,
      partners,
      runs,
      hasCompletedOnboarding,
      step,
      messages,
      mealLogs,
      nutrition,
      coachMessages,
    })
    const timeout = window.setTimeout(
      () =>
        setStorageError(
          saved
            ? ''
            : 'Your changes could not be saved in this browser. They will be lost on refresh.',
        ),
      0,
    )
    return () => window.clearTimeout(timeout)
  }, [
    session,
    loadedEmail,
    profile,
    plan,
    partners,
    runs,
    hasCompletedOnboarding,
    step,
    messages,
    mealLogs,
    nutrition,
    coachMessages,
    invitedPartners,
    coachAdviceKey,
    nutritionMessages,
    distanceKm,
    runSeconds,
    analysis,
  ])

  function restoreData(data: RunnerData) {
    setIsThinking(false)
    setValidationError('')
    setRunState(data.runDraft ? 'paused' : 'ready')
    setRunSeconds(data.runDraft?.seconds ?? 0)
    setDistanceKm(data.runDraft?.distanceKm ?? 0)
    setAnalysis(null)
    setRunError('')
    setProfile(data.profile)
    setPlan(data.plan)
    setPartners(data.partners)
    setRuns(data.runs)
    setMealLogs(data.mealLogs)
    setNutrition(data.nutrition)
    setCoachMessages(data.coachMessages)
    setInvitedPartners(data.invitedPartners)
    setCoachAdviceKey(data.coachAdviceKey)
    setNutritionMessages(data.nutritionMessages)
    setHasCompletedOnboarding(data.hasCompletedOnboarding)
    setStep(data.step)
    if (data.messages.length) setMessages(data.messages)
    else setMessages([{ role: 'ai', text: getPrompt(0) }])
    setIsOnboardingOpen(!data.hasCompletedOnboarding)
  }

  useEffect(() => {
    if (!chatRef.current) {
      return
    }

    window.requestAnimationFrame(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    })
  }, [messages, isThinking, step])

  useEffect(() => {
    if (runState !== 'active') {
      return
    }

    const startedAt = Date.now()
    let elapsed = 0
    const timer = window.setInterval(() => {
      const nextElapsed = Math.floor((Date.now() - startedAt) / 1000)
      const delta = nextElapsed - elapsed
      elapsed = nextElapsed
      if (delta <= 0) return
      setRunSeconds((current) => current + delta)
      setDistanceKm((current) => Number((current + delta * 0.0032).toFixed(4)))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [runState])

  const login = (nextSession: UserSession) => {
    ownerRef.current = nextSession.email
    try {
      saveActiveSession(getBrowserStorage(), nextSession)
    } catch {
      setStorageError('Could not save your login. You will need to sign in again after refreshing.')
    }
    restoreData(
      readRunnerData(getBrowserStorage(), nextSession.email) ?? createRunnerData(initialProfile),
    )
    setSession(nextSession)
    setLoadedEmail(nextSession.email)
    setStage('dashboard')
  }

  const logout = () => {
    ownerRef.current = null
    try {
      clearActiveSession(getBrowserStorage())
    } catch {
      /* Storage can be disabled by the browser. */
    }
    setLoadedEmail(null)
    setSession(null)
    setIsOnboardingOpen(false)
    setRunState('ready')
    setStage('landing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const resetDemo = () => {
    setProfile(initialProfile)
    setStep(0)
    setMessages([
      {
        role: 'ai',
        text: 'Welcome in. I will ask one thing at a time, then build your first running week.',
      },
      {
        role: 'ai',
        text: getPrompt(0),
      },
    ])
    setIsThinking(false)
    setIsOnboardingOpen(true)
    setHasCompletedOnboarding(false)
    setPlan(null)
    setPartners([])
    // Restarting onboarding preserves the runner's activity and nutrition history.
    setRunState('ready')
    setRunSeconds(0)
    setDistanceKm(0)
    setAnalysis(null)
    setValidationError('')
    setStage('dashboard')
  }

  const continueOnboarding = async () => {
    if (isThinking) return
    const owner = ownerRef.current
    const result = validateOnboardingStep(step, profile)

    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Please check this answer.')
      return
    }

    setValidationError('')
    setMessages((current) => [...current, { role: 'user', text: summarizeStep(step, profile) }])

    try {
      if (step === onboarding.length - 1) {
        setIsThinking(true)
        setMessages((current) => [
          ...current,
          { role: 'ai', text: 'Got it. I understand what you are aiming for.' },
          { role: 'ai', text: 'Analyzing your profile and building your personalized plan...' },
        ])
        const [nextPlan, nextPartners] = await Promise.all([
          aiService.generateRunningPlan(profile),
          aiService.suggestPartners(profile),
        ])
        if (ownerRef.current !== owner) return
        setPlan(nextPlan)
        setPartners(nextPartners)
        setHasCompletedOnboarding(true)
        setIsThinking(false)
        setIsOnboardingOpen(false)
        return
      }

      const nextStep = step + 1
      setStep(nextStep)
      setIsThinking(true)
      const response = await aiService.generateOnboardingResponse(profile, nextStep)
      if (ownerRef.current !== owner) return
      setMessages((current) => [
        ...current,
        { role: 'ai', text: response },
        { role: 'ai', text: getPrompt(nextStep) },
      ])
      setIsThinking(false)
    } catch {
      if (ownerRef.current === owner) {
        setValidationError('Could not update your coaching plan. Please try again.')
        setIsThinking(false)
        setStep(step)
      }
    }
  }

  const startRun = () => {
    if (analysis || runSeconds === 0) {
      setRunState('ready')
      setRunSeconds(0)
      setDistanceKm(0)
      setAnalysis(null)
    }
    setRunError('')
    setStage('tracker')
  }

  const closeRun = () => {
    if (finishingRef.current) return
    if (runState === 'active') setRunState('paused')
    setStage('dashboard')
  }

  const editProfile = () => {
    setStep(0)
    setMessages([
      {
        role: 'ai',
        text: 'Let us update your running profile. Your current answers are filled in.',
      },
      { role: 'ai', text: getPrompt(0) },
    ])
    setValidationError('')
    setRunState('paused')
    setStage('dashboard')
    setIsOnboardingOpen(true)
  }

  const finishRun = async () => {
    const owner = ownerRef.current
    if (finishingRef.current || runSeconds < 1) return
    finishingRef.current = true
    setRunState('paused')
    setIsThinking(true)
    setRunError('')
    try {
      const result = await aiService.analyzeRun(profile, distanceKm, runSeconds)
      if (ownerRef.current !== owner) return
      setAnalysis(result)
      setRuns((current) => [
        ...current,
        { date: new Date().toISOString(), distanceKm, seconds: runSeconds, analysis: result },
      ])
      setStage('summary')
    } catch {
      if (ownerRef.current === owner)
        setRunError('Could not save your run. Your session is paused; please retry.')
    } finally {
      finishingRef.current = false
      if (ownerRef.current === owner) setIsThinking(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#edf1f6] text-[#102b50]">
      {storageError && (
        <p
          role="alert"
          className="fixed bottom-4 left-4 right-4 z-[100] rounded-md bg-white p-3 text-sm text-red-700 shadow-md"
        >
          {storageError}
        </p>
      )}
      <RunningHeader
        hasSession={Boolean(session)}
        onLogout={logout}
        onOpenOnboarding={editProfile}
        onReset={resetDemo}
        showActions={stage !== 'landing' && stage !== 'login'}
        userName={session?.name}
        userEmail={session?.email}
      />
      {stage === 'landing' || stage === 'login' ? (
        <WelcomePage onSignUp={() => setStage('login')} />
      ) : null}
      <AnimatePresence>
        {stage === 'login' && (
          <SignInModal key="sign-in" onClose={() => setStage('landing')} onLogin={login} />
        )}
      </AnimatePresence>
      {stage === 'dashboard' || stage === 'tracker' || stage === 'summary' ? (
        <TrainingDashboard
          key={session?.email}
          onOpenOnboarding={editProfile}
          partners={partners}
          plan={plan}
          profile={profile}
          runs={runs}
          mealLogs={mealLogs}
          nutrition={nutrition}
          coachMessages={coachMessages}
          invitedPartners={invitedPartners}
          coachAdviceKey={coachAdviceKey}
          onCoachAdviceKeyChange={setCoachAdviceKey}
          onInvite={(name) =>
            setInvitedPartners((current) => (current.includes(name) ? current : [...current, name]))
          }
          nutritionMessages={nutritionMessages}
          onNutritionMessagesChange={setNutritionMessages}
          onCoachMessagesChange={setCoachMessages}
          onMealLog={(meal, date) => setMealLogs((logs) => [...logs, { date, meal }])}
          startRun={startRun}
          userName={session?.name ?? 'Runner'}
        />
      ) : null}
      <AnimatePresence>
        {(stage === 'tracker' || stage === 'summary') && (
          <RunModal
            key="run"
            distanceKm={distanceKm}
            runSeconds={runSeconds}
            runState={runState}
            analysis={analysis}
            isSaving={isThinking}
            error={runError}
            onStateChange={setRunState}
            onFinish={finishRun}
            onClose={closeRun}
            onRunAgain={startRun}
          />
        )}
      </AnimatePresence>
      {isOnboardingOpen && stage === 'dashboard' ? (
        <OnboardingModal
          chatRef={chatRef}
          closeDisabled={!hasCompletedOnboarding}
          continueOnboarding={continueOnboarding}
          isThinking={isThinking}
          messages={messages}
          onClose={() => setIsOnboardingOpen(false)}
          profile={profile}
          progress={progress}
          setProfile={setProfile}
          step={step}
          validationError={validationError}
        />
      ) : null}
    </main>
  )
}

const OnboardingModal = ({
  chatRef,
  closeDisabled,
  continueOnboarding,
  isThinking,
  messages,
  onClose,
  profile,
  progress,
  setProfile,
  step,
  validationError,
}: {
  chatRef: React.RefObject<HTMLDivElement | null>
  closeDisabled: boolean
  continueOnboarding: () => void
  isThinking: boolean
  messages: ChatMessage[]
  onClose: () => void
  profile: RunnerProfile
  progress: number
  setProfile: React.Dispatch<React.SetStateAction<RunnerProfile>>
  step: number
  validationError: string
}) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Coach onboarding"
    className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-6"
  >
    <section className="flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-[#ffffff]  sm:h-[min(92vh,760px)]">
      <div className="flex flex-none items-center justify-between border-b border-[#c5d0e0] px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase  text-[#3052af]">AI onboarding chat</p>
          <h2 className="text-xl font-semibold">{onboarding[step]}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[#005cff] px-3 py-1 text-xs font-bold text-white">
            {progress}%
          </span>
          <button
            aria-label="Close onboarding"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c5d0e0] bg-[#ffffff] disabled:opacity-40"
            disabled={closeDisabled}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div
        ref={chatRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#e9eef7] px-4 py-4 sm:px-5"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={`max-w-[84%] rounded-lg px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'bg-[#0b1f3a] text-white'
                  : 'bg-[#ffffff] text-[#102b50]  ring-1 ring-[#c5d0e0]'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isThinking ? (
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#3052af]  ring-1 ring-[#c5d0e0]">
            <Loader2 className="animate-spin" size={16} />
            AI is thinking
          </div>
        ) : null}
      </div>
      <div className="flex flex-none flex-col border-t border-[#c5d0e0] bg-[#ffffff]">
        <div className="max-h-[38dvh] overflow-y-auto p-4 sm:max-h-[32vh] sm:p-5">
          <p className="mb-3 text-sm font-semibold text-[#102b50]">{getPrompt(step)}</p>
          <StepFields profile={profile} setProfile={setProfile} step={step} />
          {validationError ? (
            <p className="mt-3 text-sm font-semibold text-[#b42318]">{validationError}</p>
          ) : null}
        </div>
        <div className="border-t border-[#edf1f7] p-4 sm:px-5">
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#005cff] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={isThinking}
            onClick={continueOnboarding}
            type="button"
          >
            {step === onboarding.length - 1 ? 'Build my plan' : 'Send answer'}
            {isThinking ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </div>
      </div>
    </section>
  </div>
)

const StepFields = ({
  profile,
  setProfile,
  step,
}: {
  profile: RunnerProfile
  setProfile: React.Dispatch<React.SetStateAction<RunnerProfile>>
  step: number
}) => {
  if (step === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Weight"
          onChange={(weightKg) =>
            setProfile((current) => ({ ...current, health: { ...current.health, weightKg } }))
          }
          placeholder="68 kg"
          value={profile.health.weightKg}
        />
        <TextField
          label="Height"
          onChange={(heightCm) =>
            setProfile((current) => ({ ...current, health: { ...current.health, heightCm } }))
          }
          placeholder="172 cm"
          value={profile.health.heightCm}
        />
        <TextField
          label="Age"
          onChange={(age) =>
            setProfile((current) => ({ ...current, health: { ...current.health, age } }))
          }
          placeholder="32"
          value={profile.health.age}
        />
        <TextField
          label="Medical conditions"
          onChange={(medicalConditions) =>
            setProfile((current) => ({
              ...current,
              health: { ...current.health, medicalConditions },
            }))
          }
          placeholder="None, asthma, knee pain..."
          value={profile.health.medicalConditions}
        />
      </div>
    )
  }

  if (step === 1) {
    return (
      <ChoiceGrid
        options={goals}
        selected={profile.goal}
        onSelect={(goal) => setProfile((current) => ({ ...current, goal: goal as RunningGoal }))}
      />
    )
  }

  if (step === 2) {
    return (
      <ChoiceGrid
        options={levels}
        selected={profile.level}
        onSelect={(level) =>
          setProfile((current) => ({ ...current, level: level as RunningLevel }))
        }
      />
    )
  }

  if (step === 3) {
    return (
      <TextArea
        label="Current running ability"
        onChange={(currentAbility) => setProfile((current) => ({ ...current, currentAbility }))}
        placeholder="I can run 5K slowly, or I am starting with walk-runs."
        value={profile.currentAbility}
      />
    )
  }

  if (step === 4) {
    return (
      <div className="space-y-4">
        <TextField
          label="Available days per week"
          onChange={(daysPerWeek) =>
            setProfile((current) => ({
              ...current,
              schedule: { ...current.schedule, daysPerWeek },
            }))
          }
          placeholder="3"
          value={profile.schedule.daysPerWeek}
        />
        <div>
          <p className="mb-2 text-sm font-semibold text-[#102b50]">Available days</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {days.map((day) => {
              const selected = profile.schedule.days.includes(day)

              return (
                <button
                  className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? 'border-[#0b1f3a] bg-[#e2eaff] text-[#2446a2]'
                      : 'border-[#c5d0e0] bg-[#ffffff] text-[#526580]'
                  }`}
                  key={day}
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      schedule: {
                        ...current.schedule,
                        days: selected
                          ? current.schedule.days.filter((item) => item !== day)
                          : [...current.schedule.days, day],
                      },
                    }))
                  }
                  type="button"
                >
                  {day.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>
        <ChoiceGrid
          options={times}
          selected={profile.schedule.time}
          onSelect={(time) =>
            setProfile((current) => ({ ...current, schedule: { ...current.schedule, time } }))
          }
        />
      </div>
    )
  }

  if (step === 5) {
    return (
      <ChoiceGrid
        options={trainingLoads}
        selected={profile.trainingLoad}
        onSelect={(trainingLoad) =>
          setProfile((current) => ({ ...current, trainingLoad: trainingLoad as TrainingLoad }))
        }
      />
    )
  }

  if (step === 6) {
    return (
      <TextArea
        label="Consistency blocker"
        onChange={(consistencyBlocker) =>
          setProfile((current) => ({ ...current, consistencyBlocker }))
        }
        placeholder="Busy workdays, no partner, low motivation, injury worry..."
        value={profile.consistencyBlocker}
      />
    )
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Preferred partner age range"
        onChange={(ageRange) =>
          setProfile((current) => ({
            ...current,
            partnerPreference: { ...current.partnerPreference, ageRange },
          }))
        }
        placeholder="25-40"
        value={profile.partnerPreference.ageRange}
      />
      <ChoiceGrid
        options={partnerLevels}
        selected={profile.partnerPreference.level}
        onSelect={(level) =>
          setProfile((current) => ({
            ...current,
            partnerPreference: {
              ...current.partnerPreference,
              level: level as RunningLevel | 'Any level',
            },
          }))
        }
      />
      <ChoiceGrid
        options={partnerGenders}
        selected={profile.partnerPreference.gender}
        onSelect={(gender) =>
          setProfile((current) => ({
            ...current,
            partnerPreference: {
              ...current.partnerPreference,
              gender: gender as PartnerGenderPreference,
            },
          }))
        }
      />
    </div>
  )
}

const TextField = ({ label, onChange, placeholder, value }: FieldProps) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-[#102b50]">{label}</span>
    <input
      className="h-12 w-full rounded-lg border border-[#c5d0e0] bg-[#ffffff] px-4 text-sm outline-none focus:border-[#0b1f3a] focus:ring-4 focus:ring-[#e2eaff]"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  </label>
)

const TextArea = ({ label, onChange, placeholder, value }: FieldProps) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-[#102b50]">{label}</span>
    <textarea
      className="min-h-28 w-full resize-none rounded-lg border border-[#c5d0e0] bg-[#ffffff] px-4 py-4 text-sm leading-6 outline-none focus:border-[#0b1f3a] focus:ring-4 focus:ring-[#e2eaff]"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  </label>
)

interface FieldProps {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

const ChoiceGrid = ({
  onSelect,
  options,
  selected,
}: {
  onSelect: (option: string) => void
  options: readonly string[]
  selected: string
}) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {options.map((option) => (
      <button
        className={`flex min-h-12 items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
          selected === option
            ? 'border-[#0b1f3a] bg-[#e2eaff] text-[#2446a2]'
            : 'border-[#c5d0e0] bg-[#ffffff] text-[#526580]'
        }`}
        key={option}
        onClick={() => onSelect(option)}
        type="button"
      >
        {option}
        {selected === option ? <Check size={17} /> : null}
      </button>
    ))}
  </div>
)

const getPrompt = (step: number) => {
  const prompts = [
    'What should I know about your health?',
    'What is your main running goal?',
    'What is your current running level?',
    'What can you comfortably run today?',
    'Which days and times can you run?',
    'How challenging should training feel?',
    'What makes consistency difficult?',
    'Who would you prefer to run with?',
  ]

  return prompts[step] ?? prompts[0]
}

const summarizeStep = (step: number, profile: RunnerProfile) => {
  if (step === 0) {
    return `Health: ${profile.health.weightKg || 'weight not set'}, ${profile.health.heightCm || 'height not set'}, age ${
      profile.health.age || 'not set'
    }, conditions: ${profile.health.medicalConditions || 'none listed'}`
  }

  if (step === 1) {
    return `Goal: ${profile.goal}`
  }

  if (step === 2) {
    return `Level: ${profile.level}`
  }

  if (step === 3) {
    return `Current ability: ${profile.currentAbility || 'Still figuring it out'}`
  }

  if (step === 4) {
    return `Schedule: ${profile.schedule.daysPerWeek} days/week, ${profile.schedule.days.join(', ') || 'flexible days'}, ${profile.schedule.time}`
  }

  if (step === 5) {
    return `Training feel: ${profile.trainingLoad}`
  }

  if (step === 6) {
    return `Consistency blocker: ${profile.consistencyBlocker || 'No major blocker'}`
  }

  return `Partner: ${profile.partnerPreference.ageRange}, ${profile.partnerPreference.level}, ${profile.partnerPreference.gender}`
}
