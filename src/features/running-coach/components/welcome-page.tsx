'use client'

import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  Footprints,
  MessageCircle,
  Users,
  Utensils,
} from 'lucide-react'
import { BrandLogo } from './brand-logo'

const features = [
  {
    icon: CalendarDays,
    title: 'A week that fits you',
    description: 'Build a training plan around your running level, goals, and available days.',
  },
  {
    icon: MessageCircle,
    title: 'Your daily coach',
    description:
      'Check in, ask questions, and get advice with your latest training and food logs in context.',
  },
  {
    icon: Footprints,
    title: 'Every run counts',
    description: 'Log runs with distance, time, pace, and a coach review.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Progress you can see',
    description:
      'Follow your run streak, weekly sessions, longest distance, and monthly progression.',
  },
  {
    icon: Utensils,
    title: 'Keep track of your fuel',
    description: 'Track your daily carbs, protein, and fat with food logs.',
  },
  {
    icon: Users,
    title: 'Find your running people',
    description: 'Find runners who match your preferences and save invitations.',
  },
]

export function WelcomePage({ onSignUp }: { onSignUp: () => void }) {
  return (
    <>
      <section className="border-b border-[#bfcde0] bg-[#edf1f6] px-4 pb-12 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <BrandLogo size={88} />
          <h1 className="pacemate-heading mt-5 text-6xl sm:text-7xl">PaceMate</h1>
          <p className="mt-5 text-xl font-semibold text-[#142e55] sm:text-2xl">
            Never run blind. Never run alone.
          </p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#526580] sm:text-base sm:leading-7">
            Your training, your progress, and your next running partner. All in one place, at your
            pace.
          </p>
          <button
            type="button"
            onClick={onSignUp}
            className="mt-7 inline-flex h-12 items-center justify-center gap-3 rounded-md bg-[#005cff] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Sign up <ArrowRight size={18} />
          </button>
        </div>
      </section>
      <section className="bg-white px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#d3dce9] pb-5">
            <h2 className="panel-title !text-2xl">Your running, connected</h2>
            <p className="text-sm text-[#526580]">From your first plan to your next milestone.</p>
          </div>
          <div className="grid gap-x-10 gap-y-8 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <Icon size={23} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#005cff]" />
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[#142e55]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#526580]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-[#bfcde0] bg-[#142e55] px-4 py-5 text-center text-xs leading-5 text-[#d7e7ff]">
        PaceMate
      </footer>
    </>
  )
}
