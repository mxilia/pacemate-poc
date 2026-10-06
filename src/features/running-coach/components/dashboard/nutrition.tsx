'use client'

import { Loader2, Send, Utensils } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CoachContext, MealLog } from '@/types/coach-ai'
import type { RunnerData } from '@/types/runner'
import { aiService } from '@/services/coach-ai/coach-service'
import { nutritionRequestSchema, nutritionResponseSchema } from '@/features/running-coach/schema'

export function Nutrition({
  context,
  onLog,
  savedMessages,
  onMessagesChange,
}: {
  context: CoachContext
  onLog: (meal: MealLog, date: string) => void
  savedMessages: RunnerData['nutritionMessages']
  onMessagesChange: (messages: RunnerData['nutritionMessages']) => void
}) {
  const { nutritionTargets: targets, macros: consumed } = context.today
  const [input, setInput] = useState('')
  const messagesRef = useRef(savedMessages)
  useEffect(() => {
    messagesRef.current = savedMessages
  }, [savedMessages])
  const reply =
    savedMessages
      .filter((message) => message.date === context.today.date && message.role === 'assistant')
      .at(-1)?.content ?? ''
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)
  const sendingRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function submit() {
    if (!input.trim() || sendingRef.current) return
    sendingRef.current = true
    setIsSending(true)
    setError('')
    try {
      const request = nutritionRequestSchema.parse({ context, message: input })
      const response = nutritionResponseSchema.parse(await aiService.processNutrition(request))
      if (!mountedRef.current) return
      onMessagesChange([
        ...messagesRef.current,
        { date: request.context.today.date, role: 'user', content: request.message },
        { date: request.context.today.date, role: 'assistant', content: response.message },
      ])
      if (response.status === 'logged' && response.meal) {
        onLog(response.meal, request.context.today.date)
        setInput('')
      }
    } catch {
      setError('Could not process this entry. Your totals are unchanged. Try sending again.')
    } finally {
      sendingRef.current = false
      if (mountedRef.current) setIsSending(false)
    }
  }
  return (
    <article
      id="nutrition"
      className="sport-panel flex flex-col scroll-mt-24 lg:col-span-8 lg:col-start-1 lg:row-start-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="panel-title">Daily nutrition targets</h2>
        <span className="flex items-center gap-2 text-sm font-semibold text-[#3052af]">
          <Utensils size={16} />
          {targets.caloriesKcal.toLocaleString()} kcal
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {(['carbs', 'protein', 'fat'] as const).map((macro) => (
          <div key={macro} className="min-w-0">
            <p className="text-xs font-medium capitalize text-[#526580]">
              {macro === 'carbs' ? 'Carbohydrates' : macro}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {targets[macro]}
              <span className="ml-1 text-sm font-normal text-[#526580]">g</span>
            </p>
            <progress
              className="sport-progress mt-4"
              value={Math.min(consumed[macro], targets[macro])}
              max={targets[macro]}
              aria-label={`${macro} consumed toward daily target`}
            />
            <p className="mt-3 text-xs text-[#526580]">{consumed[macro]} g eaten</p>
            <p className="mt-1 text-xs font-semibold text-[#3052af]">
              {Math.round(Math.max(0, targets[macro] - consumed[macro]) * 10) / 10} g remaining
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-[#d3dce9] pt-4">
        {reply && (
          <p
            role="status"
            className="mb-3 rounded-md bg-[#edf2fc] px-3 py-2 text-xs leading-5 text-[#1b3558]"
          >
            {reply}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-3 text-xs text-red-700">
            {error}
          </p>
        )}
        <form
          className="flex gap-2 rounded-lg border border-[#b9cbea] bg-white p-2"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          aria-busy={isSending}
        >
          <input
            aria-label="Food eaten"
            placeholder="100g rice and 2 eggs..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            maxLength={1000}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            aria-label="Send food entry"
            title="Send food entry"
            disabled={!input.trim() || isSending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white disabled:opacity-30"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </article>
  )
}
