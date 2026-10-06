'use client'

import { Activity, Moon } from 'lucide-react'
import type { RunningPlan } from '@/types/coach-ai'
import { weekDays } from './constants'

export function TrainingWeek({ plan, today }: { plan: RunningPlan | null; today: string }) {
  return (
    <article
      id="training"
      className="sport-panel scroll-mt-24 lg:col-span-4 lg:col-start-9 lg:row-start-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="panel-title">Your training week</h2>
        <span className="font-mono text-xs text-[#526580]">{plan?.weeklyDistanceKm ?? 0} KM</span>
      </div>
      <div className="mt-3 divide-y divide-[#d3dce9]">
        {weekDays.map((day) => {
          const training = plan?.sessions.find((item) => item.day === day)
          const isToday = day === today
          return (
            <div
              key={day}
              aria-current={isToday ? 'date' : undefined}
              className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${isToday ? 'rounded-md bg-[#2563eb] text-white' : ''}`}
            >
              <span className={isToday ? 'font-semibold text-white' : 'text-[#526580]'}>
                {day.slice(0, 3)}
                {isToday ? <span className="ml-2 text-[10px] text-[#dbeafe]">TODAY</span> : null}
              </span>
              <span
                className={`flex items-center gap-2 text-xs ${isToday ? 'text-white' : 'text-[#304969]'}`}
              >
                {training ? (
                  <>
                    <Activity size={13} />
                    {training.title}
                    <span className="ml-1 font-mono">{training.distanceKm} km</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} />
                    {plan ? 'Recovery' : '--'}
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </article>
  )
}
