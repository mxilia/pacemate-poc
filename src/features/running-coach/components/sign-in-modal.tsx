'use client'

import { ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { userSessionSchema } from '@/features/running-coach/storage-schema'
import type { UserSession } from '@/types/runner'
import { AnimatedModal } from './animated-modal'

export function SignInModal({
  onClose,
  onLogin,
}: {
  onClose: () => void
  onLogin: (session: UserSession) => void
}) {
  const id = useId()
  const [name, setName] = useState('Example')
  const [email, setEmail] = useState('runner@example.com')
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  return (
    <AnimatedModal
      title={isSignUp ? 'Sign up to PaceMate' : 'Sign in to PaceMate'}
      description="Your goals. Your pace. A coach in your corner."
      closeLabel="Close account modal"
      onClose={onClose}
    >
      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const result = userSessionSchema.safeParse({ name: name.trim(), email: email.trim() })
          if (!result.success) {
            setError(
              result.error.issues[0]?.path[0] === 'name'
                ? 'Enter your name.'
                : 'Enter a valid email address.',
            )
            return
          }
          setError('')
          onLogin(result.data)
        }}
      >
        <div>
          <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-medium">
            Name
          </label>
          <input
            data-autofocus
            id={`${id}-name`}
            autoComplete="name"
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-md border border-[#b9cbea] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-md border border-[#b9cbea] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2563eb] text-sm font-semibold text-white hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        >
          {isSignUp ? 'Sign up' : 'Sign in'}
          <ChevronRight size={17} />
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[#526580]">
        {isSignUp ? 'Already have a profile? ' : 'New to PaceMate? '}
        <button
          type="button"
          className="font-semibold text-[#2563eb] hover:underline"
          onClick={() => setIsSignUp((current) => !current)}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </AnimatedModal>
  )
}
