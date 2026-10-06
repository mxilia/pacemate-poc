'use client'

import { Check, Clock3, Footprints, Loader2, Pause, Play, RotateCcw } from 'lucide-react'
import type { RunAnalysis } from '@/types/coach-ai'
import { AnimatedModal } from './animated-modal'

export type RunState = 'ready' | 'active' | 'paused'

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const formatPace = (distance: number, seconds: number) => {
  if (distance <= 0 || seconds <= 0) return '--:--'
  const pace = Math.round(seconds / distance)
  return `${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, '0')}`
}

export function RunModal({
  distanceKm,
  runSeconds,
  runState,
  analysis,
  isSaving,
  error,
  onStateChange,
  onFinish,
  onClose,
  onRunAgain,
}: {
  distanceKm: number
  runSeconds: number
  runState: RunState
  analysis: RunAnalysis | null
  isSaving: boolean
  error: string
  onStateChange: (state: RunState) => void
  onFinish: () => void
  onClose: () => void
  onRunAgain: () => void
}) {
  const status = analysis
    ? 'Saved'
    : isSaving
      ? 'Saving'
      : runState === 'active'
        ? 'Running'
        : runState === 'paused'
          ? 'Paused'
          : 'Ready'
  return (
    <AnimatedModal
      wide
      title={analysis ? 'Run complete' : 'Log a run'}
      description={analysis ? 'Run saved' : 'Distance, time, and pace'}
      closeLabel="Close run"
      onClose={onClose}
      busy={isSaving}
    >
      <div className="mt-6 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-semibold text-[#2563eb]">
          {analysis ? <Check size={15} /> : <Footprints size={15} />}
          {status}
        </span>
      </div>
      <div className="mt-3 bg-[#142e55] px-5 py-6 text-white">
        <p className="text-xs font-medium text-[#c9dbff]">Distance</p>
        <p className="mt-2 flex items-baseline gap-2 font-bold tabular-nums">
          <span className="text-5xl">{distanceKm.toFixed(2)}</span>
          <span className="text-lg font-normal text-[#c9dbff]">km</span>
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[#d3dce9] border-b border-[#d3dce9] py-5">
        <div className="pr-4">
          <p className="flex items-center gap-2 text-xs text-[#526580]">
            <Clock3 size={14} />
            Elapsed time
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{formatTime(runSeconds)}</p>
        </div>
        <div className="pl-5">
          <p className="text-xs text-[#526580]">Average pace</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatPace(distanceKm, runSeconds)}
          </p>
          <p className="mt-1 text-xs text-[#526580]">min / km</p>
        </div>
      </div>
      {analysis ? (
        <>
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Coach review</h3>
            <p className="mt-2 text-sm leading-6 text-[#526580]">{analysis.coachNote}</p>
            <p className="mt-2 text-sm leading-6 text-[#3052af]">{analysis.nextStep}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="sport-button justify-center" onClick={onRunAgain}>
              <RotateCcw size={16} />
              Run again
            </button>
            <button
              type="button"
              autoFocus
              data-autofocus
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              onClick={onClose}
            >
              <Check size={16} />
              Done
            </button>
          </div>
        </>
      ) : (
        <>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              data-autofocus
              disabled={isSaving}
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-40"
              onClick={() => onStateChange(runState === 'active' ? 'paused' : 'active')}
            >
              {runState === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {runState === 'active' ? 'Pause' : runState === 'paused' ? 'Resume' : 'Start run'}
            </button>
            <button
              type="button"
              className="sport-button justify-center disabled:opacity-40"
              onClick={onFinish}
              disabled={isSaving || runSeconds < 1}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? 'Saving...' : error ? 'Retry save' : 'Finish run'}
            </button>
          </div>
        </>
      )}
    </AnimatedModal>
  )
}
