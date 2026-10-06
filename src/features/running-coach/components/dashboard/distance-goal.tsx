'use client'

import { Target } from 'lucide-react'
import type { CoachContext, RunningGoal } from '@/types/coach-ai'

export function DistanceGoal({
  progress,
  goal,
}: {
  progress: CoachContext['progress']
  goal: RunningGoal
}) {
  const { longestRunKm: best, targetDistanceKm: target } = progress
  const percent = progress.goalPercent ?? 0
  return (
    <article className="sport-panel goal-panel flex flex-col lg:col-span-6 lg:col-start-1 lg:row-start-3 lg:h-[280px]">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Distance goal</h2>
        <Target size={19} className="text-[#3052af]" />
      </div>
      <div className="mt-5 grid flex-1 grid-cols-[128px_minmax(0,1fr)] items-center gap-4">
        <div className="relative h-32 w-32">
          <svg
            viewBox="0 0 160 160"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label={target ? `${percent}% of ${target} km goal` : 'No distance goal selected'}
          >
            <circle cx="80" cy="80" r="66" fill="none" stroke="#dce4f0" strokeWidth="10" />
            <circle
              cx="80"
              cy="80"
              r="66"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="414.69"
              strokeDashoffset={414.69 * (1 - percent / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{target ? `${percent}%` : '--'}</span>
            <span className="mt-1 text-xs text-[#526580]">
              {target ? 'of your goal' : 'distance goal'}
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-[#526580]">Longest distance</p>
          <p className="mt-1 text-2xl font-bold">
            {best.toFixed(1)} <span className="text-sm font-normal text-[#526580]">km</span>
          </p>
          <div className="my-3 h-px bg-[#cdd7e6]" />
          <p className="text-xs text-[#526580]">{target ? `Target: ${target} km` : goal}</p>
          <p className="mt-2 text-sm text-[#26499c]">
            {target
              ? best >= target
                ? 'Distance goal reached.'
                : `${(target - best).toFixed(1)} km to your next milestone.`
              : 'Build consistency with your weekly plan.'}
          </p>
        </div>
      </div>
    </article>
  )
}
