'use client'

import { Activity, Clock3, Moon, Play } from 'lucide-react'
import type { RunningPlan, TrainingSession } from '@/types/coach-ai'

export function TodaySession({
  plan,
  session,
  nextSession,
  preferredTime,
  onStartRun,
}: {
  plan: RunningPlan | null
  session: TrainingSession | null
  nextSession: TrainingSession | null
  preferredTime: string
  onStartRun: () => void
}) {
  return (
    <article className="sport-panel today-panel md:col-span-2 lg:col-span-8 lg:col-start-1 lg:row-start-1">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Today&apos;s session</h2>
        <span className="text-xs text-[#c9dbff]">{session ? 'Run day' : 'Recovery day'}</span>
      </div>
      <div className="mt-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#142540] text-[#d1dff3]">
          {session ? <Activity size={25} /> : <Moon size={25} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold">
            {!plan ? 'Set up your training plan' : (session?.title ?? 'Rest day')}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#526580]">
            {session?.note ??
              (plan
                ? 'No run scheduled. Take time to recover before your next session.'
                : 'Complete your coach profile to get a personal schedule.')}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#ccd6e6] pt-4">
        <span className="flex items-center gap-2 text-sm text-[#c2cfdf]">
          <Clock3 size={16} />
          {session
            ? `${preferredTime} ${session.distanceKm} km / ${session.intensity}`
            : nextSession
              ? `Next: ${nextSession.day} / ${nextSession.distanceKm} km`
              : 'Set your available days'}
        </span>
        <button
          className="sport-button sport-button-primary"
          disabled={!plan}
          onClick={onStartRun}
          type="button"
        >
          <Play size={15} />
          {session ? 'Start session' : 'Log a run'}
        </button>
      </div>
    </article>
  )
}
