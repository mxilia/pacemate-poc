'use client'

import { Check, Flame } from 'lucide-react'
import type { CompletedRun } from '@/types/coach-ai'
import { weekDays } from './constants'

const localDate = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

export function RunStreak({
  runs,
  streak,
  now,
}: {
  runs: CompletedRun[]
  streak: number
  now: Date
}) {
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  )
  const completedDays = new Set(runs.map((run) => localDate(new Date(run.date))))

  return (
    <article className="sport-panel stat-panel lg:col-span-4 lg:col-start-1 lg:row-start-2">
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Run streak</h2>
        <Flame size={19} className="text-[#3052af]" />
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums">
        {streak}
        <span className="ml-2 text-sm font-normal text-[#526580]">
          {streak === 1 ? 'day' : 'days'}
        </span>
      </p>
      <div className="mt-5 flex justify-between gap-1">
        {weekDays.map((day, index) => {
          const date = new Date(weekStart)
          date.setDate(date.getDate() + index)
          const done = completedDays.has(localDate(date))
          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${done ? 'border-[#6e91bf] bg-[#1b3558] text-white' : 'border-[#cdd7e6] text-[#7a8ba6]'}`}
                title={`${day}${done ? ': completed' : ''}`}
              >
                {done ? <Check size={13} /> : <span className="h-1 w-1 rounded-full bg-current" />}
              </span>
              <span className="text-[10px] text-[#526580]">{day.slice(0, 1)}</span>
            </div>
          )
        })}
      </div>
    </article>
  )
}
