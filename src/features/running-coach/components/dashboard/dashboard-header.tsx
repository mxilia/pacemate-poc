'use client'

import { Target } from 'lucide-react'

export function DashboardHeader({
  userName,
  now,
  hasPlan,
  onOpenOnboarding,
}: {
  userName: string
  now: Date
  hasPlan: boolean
  onOpenOnboarding: () => void
}) {
  return (
    <>
      {' '}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="pacemate-heading text-4xl sm:text-5xl">PaceMate</h1>
          <p className="mt-2 text-sm text-[#526580]">
            Welcome back, {userName}. Here&apos;s your training overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[#526580] sm:block">
            {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button className="sport-button" onClick={onOpenOnboarding} type="button">
            <Target size={16} />
            {hasPlan ? 'Edit training profile' : 'Build my plan'}
          </button>
        </div>
      </div>{' '}
      <nav
        aria-label="Dashboard sections"
        className="mb-6 flex gap-6 overflow-x-auto border-b border-[#bdcbe0] text-sm"
      >
        <a
          className="shrink-0 border-b-2 border-[#005cff] pb-3 font-medium text-[#005cff]"
          href="#overview"
        >
          Overview
        </a>
        <a className="shrink-0 pb-3 text-[#526580] hover:text-[#005cff]" href="#training">
          Training plan
        </a>
        <a className="shrink-0 pb-3 text-[#526580] hover:text-[#005cff]" href="#nutrition">
          Nutrition
        </a>
        <a className="shrink-0 pb-3 text-[#526580] hover:text-[#005cff]" href="#partners">
          Running partners
        </a>
      </nav>{' '}
    </>
  )
}
