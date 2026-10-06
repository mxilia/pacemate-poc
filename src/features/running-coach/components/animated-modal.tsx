'use client'

import { X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BrandLogo } from './brand-logo'

export function AnimatedModal({
  title,
  description,
  closeLabel,
  onClose,
  busy = false,
  wide = false,
  children,
}: {
  title: string
  description: string
  closeLabel: string
  onClose: () => void
  busy?: boolean
  wide?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previousFocus = document.activeElement
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      dialog.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])
  return (
    <motion.dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={busy}
      className={`pacemate-modal m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] overflow-y-auto rounded-lg border border-[#b9cbea] bg-white p-6 text-[#102b50] shadow-xl sm:p-8 ${wide ? 'max-w-[520px]' : 'max-w-[420px]'}`}
      initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.92, y: reducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: reducedMotion ? 1 : 0.97,
        y: reducedMotion ? 0 : 10,
        transition: { duration: 0.15 },
      }}
      transition={
        reducedMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 380, damping: 28 }
      }
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled)',
        )
        const first = controls[0],
          last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose()
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-bold">
          <BrandLogo size={40} />
          PaceMate
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onClose}
          disabled={busy}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#526580] hover:bg-[#edf2fc] focus-visible:outline-2 focus-visible:outline-[#2563eb] disabled:opacity-30"
        >
          <X size={19} />
        </button>
      </div>
      <h2 id={`${id}-title`} className="text-2xl font-bold">
        {title}
      </h2>
      <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-[#526580]">
        {description}
      </p>
      {children}
    </motion.dialog>
  )
}
