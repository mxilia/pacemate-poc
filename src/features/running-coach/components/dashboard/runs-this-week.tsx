'use client'

import { Footprints } from 'lucide-react'
import type { CoachContext } from '@/types/coach-ai'

export function RunsThisWeek({ progress }: { progress: CoachContext['progress'] }) {
  return (
    <article className="sport-panel stat-panel lg:col-span-4 lg:col-start-5 lg:row-start-2">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Runs this week</h2>
        <Footprints size={19} className="text-[#3052af]" />
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums">
        {progress.runsThisWeek}
        <span className="ml-2 text-xl font-normal text-[#5b6d86]">
          / {progress.weeklyRunTarget}
        </span>
      </p>
      <p className="mt-2 text-xs text-[#526580]">
        {Math.max(0, progress.weeklyRunTarget - progress.runsThisWeek)} runs to your weekly target
      </p>
      <progress
        className="sport-progress mt-5"
        max={progress.weeklyRunTarget || 1}
        value={progress.runsThisWeek}
        aria-label="Completed runs this week"
      />
      <div className="mt-4 flex justify-between text-xs">
        <span className="text-[#526580]">Distance logged</span>
        <span className="font-mono">{progress.distanceThisWeekKm.toFixed(1)} km</span>
      </div>
    </article>
  )
}
