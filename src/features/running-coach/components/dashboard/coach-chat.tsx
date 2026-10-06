'use client'

import { Download, Loader2, MessageCircle, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CoachContext, CoachMessage } from '@/types/coach-ai'
import { aiService } from '@/services/coach-ai/coach-service'
import { CoachAPIError } from '@/services/api/coach'
import { coachRequestSchema, coachResponseSchema } from '@/features/running-coach/schema'

export function CoachChat({
  context,
  savedMessages,
  savedAdviceKey,
  onAdviceKeyChange,
  onMessagesChange,
}: {
  context: CoachContext
  savedMessages: CoachMessage[]
  savedAdviceKey: string
  onAdviceKeyChange: (key: string) => void
  onMessagesChange: (messages: CoachMessage[]) => void
}) {
  const adviceKey = `${context.today.date}:${context.dailyAdvice}`
  const [messages, setMessages] = useState<CoachMessage[]>(() =>
    savedAdviceKey === adviceKey || savedMessages.at(-1)?.role === 'user'
      ? savedMessages
      : [...savedMessages, { role: 'assistant', content: context.dailyAdvice }],
  )
  useEffect(() => {
    onMessagesChange(messages)
    onAdviceKeyChange(adviceKey)
  }, [messages, onMessagesChange, adviceKey, onAdviceKeyChange])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(
    savedMessages.at(-1)?.role === 'user'
      ? 'Your last message has no reply yet. Retry to continue.'
      : '',
  )
  const mountedRef = useRef(true)
  const sendingRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  const [suggestedReplies, setSuggestedReplies] = useState([
    'I feel tired',
    'This week',
    'How to fuel?',
  ])
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending, error])
  const requestReply = async (conversation: CoachMessage[]) => {
    if (sendingRef.current) return
    sendingRef.current = true
    setIsSending(true)
    setError('')
    try {
      const request = coachRequestSchema.parse({ context, messages: conversation.slice(-40) })
      const response = coachResponseSchema.parse(await aiService.generateCoachResponse(request))
      if (!mountedRef.current) return
      setMessages((current) => [...current, response.message])
      setSuggestedReplies(response.suggestedReplies)
    } catch (error) {
      if (mountedRef.current)
        setError(
          error instanceof CoachAPIError ? error.message : 'Could not reach your coach. Try again.',
        )
    } finally {
      sendingRef.current = false
      if (mountedRef.current) setIsSending(false)
    }
  }
  const send = async (text: string) => {
    if (!text.trim() || sendingRef.current || error) return
    const conversation: CoachMessage[] = [
      ...messages,
      { role: 'user' as const, content: text.trim() },
    ]
    setMessages(conversation)
    setInput('')
    await requestReply(conversation)
  }
  const exportContext = () => {
    const payload = coachRequestSchema.parse({ context, messages: messages.slice(-40) })
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'pacemate-coach-context.json'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <article className="sport-panel coach-panel flex h-[450px] flex-col lg:h-[490px]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#ccd6e6] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#142540]">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="panel-title">AI Coach</h2>
            <p className="mt-1 text-xs text-[#526580]">Daily check-in</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportContext}
            type="button"
            title="Download coaching data"
            aria-label="Download coaching data"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#2854ab] hover:bg-[#1c355b]"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="my-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === 'user'
                ? 'ml-8 rounded-lg bg-[#1f4ec9] px-4 py-3'
                : 'mr-3 rounded-lg bg-[#edf2fc] px-4 py-3'
            }
          >
            <p
              className={`mb-1 text-[10px] font-semibold uppercase ${message.role === 'user' ? 'text-[#dbe7ff]' : 'text-[#355983]'}`}
            >
              {message.role === 'user' ? 'You' : 'Coach'}
            </p>
            <p
              className={`break-words text-sm leading-6 ${message.role === 'user' ? 'text-white' : 'text-[#173454]'}`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isSending ? (
          <p className="flex items-center gap-2 text-xs text-[#2854ab]">
            <Loader2 size={14} className="animate-spin" />
            Coach is replying...
          </p>
        ) : null}
        {error ? (
          <div role="alert" className="text-xs text-[#2446a2]">
            {error}
            <button
              type="button"
              disabled={isSending}
              onClick={() => requestReply(messages)}
              className="ml-2 underline"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestedReplies.map((prompt) => (
          <button
            className="rounded-md border border-[#b9cbea] px-2.5 py-1.5 text-[11px] text-[#2d4c80] hover:bg-[#e1eaff]"
            key={prompt}
            onClick={() => send(prompt)}
            disabled={isSending || Boolean(error)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
      <form
        className="flex shrink-0 gap-2 rounded-lg border border-[#b9cbea] bg-[#ffffff] p-2"
        onSubmit={(event) => {
          event.preventDefault()
          send(input)
        }}
      >
        <input
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
          aria-label="Message your coach"
          placeholder="Ask your coach..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={1000}
        />
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white disabled:opacity-30"
          disabled={!input.trim() || isSending || Boolean(error)}
          type="submit"
          title="Send message"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </article>
  )
}
