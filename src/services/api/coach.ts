import { z } from 'zod'
import type { CoachChatRequest, CoachChatResponse } from '@/types/coach-ai'
import { coachResponseSchema } from '@/features/running-coach/schema'
import { compactCoachRequest } from '@/features/running-coach/coach-context'

export class CoachAPIError extends Error {}

async function generateCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
  let response: Response
  try {
    response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compactCoachRequest(request)),
      signal: AbortSignal.timeout(25000),
    })
  } catch {
    throw new CoachAPIError('Could not reach your coach. Please try again.')
  }
  if (!response.ok) {
    const error = z
      .object({ error: z.string().max(200) })
      .safeParse(await response.json().catch(() => null))
    throw new CoachAPIError(
      error.success ? error.data.error : 'Could not reach your coach. Please try again.',
    )
  }
  return coachResponseSchema.parse(await response.json())
}

export const coachApi = { generateCoachResponse }
