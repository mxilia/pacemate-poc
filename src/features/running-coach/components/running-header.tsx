'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, RotateCcw, Settings, UserRoundPen } from 'lucide-react'
import { BrandLogo } from './brand-logo'

type HeaderProps = {
  hasSession: boolean
  onLogout: () => void
  onOpenOnboarding: () => void
  onReset: () => void
  showActions: boolean
  userName?: string
  userEmail?: string
}

const menuItemClass =
  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#173454] outline-none data-[highlighted]:bg-[#e2eaff] data-[highlighted]:text-[#005cff]'

export function RunningHeader({
  hasSession,
  onLogout,
  onOpenOnboarding,
  onReset,
  showActions,
  userName,
  userEmail,
}: HeaderProps) {
  const initials = (userName || 'Runner')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-[#6281ad] bg-[#142e55]">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <div className="flex shrink-0 items-center gap-2 text-white">
            <BrandLogo />
            <span className="text-xl font-bold">PaceMate</span>
          </div>
          {hasSession && userName ? (
            <div
              aria-label="Your profile"
              className="flex min-w-0 items-center gap-3 border-l border-[#55739d] pl-4 sm:pl-6"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#375176] bg-[#172c49] text-xs font-semibold text-[#d7e7ff]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="max-w-28 truncate text-sm font-medium text-white sm:max-w-48">
                  {userName}
                </p>
                <p className="hidden max-w-48 truncate text-xs text-[#bccfea] sm:block">
                  {userEmail || 'Runner profile'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {showActions ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                aria-label="Settings"
                title="Settings"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#6281ad] bg-[#213f6b] text-white hover:bg-[#3052af] data-[state=open]:bg-[#3052af]"
                type="button"
              >
                <Settings size={19} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="z-50 w-60 rounded-lg border border-[#bfcde0] bg-white p-1.5"
              >
                <DropdownMenu.Label className="px-3 py-2 text-xs font-medium text-[#526580]">
                  Account settings
                </DropdownMenu.Label>
                <DropdownMenu.Item className={menuItemClass} onSelect={onOpenOnboarding}>
                  <UserRoundPen size={16} />
                  Edit running profile
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItemClass} onSelect={onReset}>
                  <RotateCcw size={16} />
                  Restart onboarding
                </DropdownMenu.Item>
                {hasSession ? (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-[#ccd6e6]" />
                    <DropdownMenu.Item className={menuItemClass} onSelect={onLogout}>
                      <LogOut size={16} />
                      Log out
                    </DropdownMenu.Item>
                  </>
                ) : null}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}
      </div>
    </header>
  )
}
