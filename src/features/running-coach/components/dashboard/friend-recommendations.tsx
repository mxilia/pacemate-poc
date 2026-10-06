'use client'

import { Check, UserPlus, Users } from 'lucide-react'
import type { PartnerMatch } from '@/types/coach-ai'

export function FriendRecommendations({
  partners,
  invited,
  onInvite,
  hasPlan,
}: {
  partners: PartnerMatch[]
  invited: string[]
  onInvite: (name: string) => void
  hasPlan: boolean
}) {
  return (
    <article id="partners" className="sport-panel scroll-mt-24 md:col-span-2 lg:col-span-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="panel-title">Running partners</h2>
          <p className="mt-1 text-xs text-[#526580]">Recommended training partners</p>
        </div>
        <Users size={20} className="text-[#3052af]" />
      </div>
      <div className="mt-4 divide-y divide-[#d3dce9]">
        {partners.map((partner) => (
          <div key={partner.name} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#aec1e0] bg-[#e2eaff] text-sm font-semibold">
                  {partner.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    {partner.name}
                    <span className="ml-2 text-[10px] text-[#3052af]">
                      {partner.matchScore}% match
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-[#526580]">
                    {partner.age} / {partner.level} / {partner.time}
                  </p>
                </div>
              </div>
              <button
                className="sport-button !h-8 !px-3 !text-xs"
                disabled={invited.includes(partner.name)}
                onClick={() => onInvite(partner.name)}
                type="button"
              >
                {invited.includes(partner.name) ? <Check size={13} /> : <UserPlus size={13} />}
                {invited.includes(partner.name) ? 'Invite saved' : 'Invite'}
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#526580]">{partner.note}</p>
          </div>
        ))}
      </div>
      {!partners.length ? (
        <p className="py-10 text-sm text-[#526580]">
          {hasPlan
            ? 'No runners match your current preferences.'
            : 'No partner recommendations yet.'}
        </p>
      ) : null}
    </article>
  )
}
