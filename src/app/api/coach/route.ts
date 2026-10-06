import 'server-only'
import { generateGroqReply, GroqServiceError } from '@groq/groq-service'
import { compactCoachRequestSchema } from '@/features/running-coach/schema'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 24 * 1024
const usage = { minuteStarted: 0, minuteCount: 0, day: '', dayCount: 0 }

function allowRequest(now: number) {
  const day = new Date(now).toISOString().slice(0, 10)
  if (usage.day !== day) {
    usage.day = day
    usage.dayCount = 0
  }
  if (now - usage.minuteStarted >= 60000) {
    usage.minuteStarted = now
    usage.minuteCount = 0
  }
  if (usage.minuteCount >= 6 || usage.dayCount >= 100) return false
  usage.minuteCount++
  usage.dayCount++
  return true
}

async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
    throw new GroqServiceError('Message is too large.', 413)
  const reader = request.body?.getReader()
  if (!reader) throw new GroqServiceError('A message is required.', 400)
  let bytes = 0
  let text = ''
  const decoder = new TextDecoder()
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new GroqServiceError('Message is too large.', 413)
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
    return JSON.parse(text + decoder.decode()) as unknown
  } finally {
    reader.releaseLock()
  }
}

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' }
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: 'Request not allowed.' }, { status: 403, headers })
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Send a JSON message.' }, { status: 415, headers })
  try {
    const result = compactCoachRequestSchema.safeParse(await readBody(request))
    if (!result.success)
      return Response.json(
        { error: 'Please check your message and runner profile.' },
        { status: 400, headers },
      )
    if (!allowRequest(Date.now()))
      return Response.json(
        { error: 'Chat limit reached. Please try again later.' },
        { status: 429, headers: { ...headers, 'Retry-After': '60' } },
      )
    return Response.json(await generateGroqReply(result.data), { headers })
  } catch (error) {
    if (error instanceof GroqServiceError)
      return Response.json(
        { error: error.message },
        {
          status: error.status,
          headers: {
            ...headers,
            ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}),
          },
        },
      )
    return Response.json(
      { error: 'Could not process your message. Please retry.' },
      { status: error instanceof SyntaxError ? 400 : 500, headers },
    )
  }
}
