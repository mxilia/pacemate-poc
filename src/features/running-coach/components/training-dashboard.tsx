'use client'

import { useEffect, useState } from 'react'
import type {
  PartnerMatch,
  RunnerProfile,
  RunningPlan,
  CompletedRun,
  CoachMessage,
  MealLog,
} from '@/types/coach-ai'
import {
  buildCoachContext,
  getBaselineDistanceKm as baselineDistance,
} from '@/features/running-coach/coach-context'
import { getNutritionForDate } from '@/features/running-coach/nutrition'
import type { RunnerData } from '@/types/runner'
import { DashboardHeader } from './dashboard/dashboard-header'
import { RunStreak } from './dashboard/run-streak'
import { RunsThisWeek } from './dashboard/runs-this-week'
import { TodaySession } from './dashboard/today-session'
import { DistanceGoal } from './dashboard/distance-goal'
import { TrainingWeek } from './dashboard/training-week'
import { CoachChat } from './dashboard/coach-chat'
import { Nutrition } from './dashboard/nutrition'
import { DistanceChart } from './dashboard/distance-chart'
import { FriendRecommendations } from './dashboard/friend-recommendations'

type Props = {
  plan: RunningPlan | null
  profile: RunnerProfile
  partners: PartnerMatch[]
  runs: CompletedRun[]
  mealLogs: RunnerData['mealLogs']
  nutrition: RunnerData['nutrition']
  coachMessages: CoachMessage[]
  invitedPartners: string[]
  coachAdviceKey: string
  onCoachAdviceKeyChange: (key: string) => void
  onInvite: (name: string) => void
  nutritionMessages: RunnerData['nutritionMessages']
  onNutritionMessagesChange: (messages: RunnerData['nutritionMessages']) => void
  onCoachMessagesChange: (messages: CoachMessage[]) => void
  onMealLog: (meal: MealLog, date: string) => void
  userName: string
  startRun: () => void
  onOpenOnboarding: () => void
}

export function TrainingDashboard({
  plan,
  profile,
  partners,
  runs,
  mealLogs,
  nutrition,
  coachMessages,
  invitedPartners,
  coachAdviceKey,
  onCoachAdviceKeyChange,
  onInvite,
  nutritionMessages,
  onNutritionMessagesChange,
  onCoachMessagesChange,
  onMealLog,
  userName,
  startRun,
  onOpenOnboarding,
}: Props) {
  const dashboardRuns = runs
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    const refresh = () => setNow(new Date())
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  const todayDate = now.toLocaleDateString('sv-SE')
  const {
    meals,
    macros: macroTotals,
    targets,
  } = getNutritionForDate({ mealLogs, nutrition }, todayDate)
  const context = buildCoachContext({
    profile,
    plan,
    runs: dashboardRuns,
    meals,
    macroTotals,
    weeklyRunTarget: plan?.sessions.length ?? Number(profile.schedule.daysPerWeek),
  })
  context.today.nutritionTargets = targets
  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-10 pt-24 sm:px-6 lg:px-10">
      <DashboardHeader
        userName={userName}
        now={now}
        hasPlan={Boolean(plan)}
        onOpenOnboarding={onOpenOnboarding}
      />
      <div
        id="overview"
        className="grid scroll-mt-24 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-12"
      >
        <div className="md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
          <CoachChat
            key={`${todayDate}:${context.dailyAdvice}`}
            context={context}
            savedMessages={coachMessages}
            savedAdviceKey={coachAdviceKey}
            onAdviceKeyChange={onCoachAdviceKeyChange}
            onMessagesChange={onCoachMessagesChange}
          />
        </div>

        <RunStreak runs={runs} streak={context.progress.streakDays} now={now} />

        <RunsThisWeek progress={context.progress} />

        <TodaySession
          plan={plan}
          session={context.today.session}
          nextSession={context.today.nextSession}
          preferredTime={profile.schedule.time}
          onStartRun={startRun}
        />

        <DistanceGoal progress={context.progress} goal={profile.goal} />

        <Nutrition
          context={context}
          savedMessages={nutritionMessages}
          onMessagesChange={onNutritionMessagesChange}
          onLog={(meal, date) => onMealLog(meal, date)}
        />
        <DistanceChart runs={dashboardRuns} baseline={baselineDistance(profile.currentAbility)} />

        <TrainingWeek plan={plan} today={context.today.day} />

        <FriendRecommendations
          hasPlan={Boolean(plan)}
          partners={partners}
          invited={invitedPartners}
          onInvite={onInvite}
        />
      </div>
    </section>
  )
}
