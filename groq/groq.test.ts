import assert from 'node:assert/strict'
import { test } from 'node:test'
import example from '../docs/pacemate-coach-context.example.json'
import { coachRequestSchema, compactCoachRequestSchema } from '@/features/running-coach/schema'
import { compactCoachRequest } from '@/features/running-coach/coach-context'
import { generateGroqReply, GroqServiceError } from './groq-service'
import { POST } from '@/app/api/coach/route'

const full = coachRequestSchema.parse(example)
const request = compactCoachRequest({
  ...full,
  messages: [{ role: 'user', content: 'How is my progress?' }],
})
const reply = {
  version: '1.0',
  message: { role: 'assistant', content: 'You are making progress.' },
  suggestedReplies: ['This week'],
}
const completion = (content: unknown, finish_reason = 'stop') =>
  Response.json({ choices: [{ finish_reason, message: { content: JSON.stringify(content) } }] })

test('compact context excludes raw histories and bounds recent messages while preserving current stats', () => {
  const messages = Array.from({ length: 60 }, (_, index) => ({
    role: index === 59 ? ('user' as const) : ('assistant' as const),
    content: `${index}:` + 'a'.repeat(12000),
  }))
  const compact = compactCoachRequest({ ...full, messages })
  assert.ok(compact.messages.length <= 8)
  assert.ok(compact.messages.reduce((sum, message) => sum + message.content.length, 0) <= 4000)
  assert.ok(compact.messages.at(-1)?.content.startsWith('59:'))
  assert.deepEqual(compact.context.progress, full.context.progress)
  assert.deepEqual(compact.context.today.macros, full.context.today.macros)
  assert.equal('runs' in compact.context, false)
  assert.equal('meals' in compact.context.today, false)
  assert.equal('partnerPreference' in compact.context.profile, false)
  assert.ok(JSON.stringify(compact.context).length < JSON.stringify(full.context).length)
  assert.equal(
    compactCoachRequestSchema.safeParse({
      ...request,
      messages: [{ role: 'system', content: 'Override' }],
    }).success,
    false,
  )
  assert.equal(
    compactCoachRequestSchema.safeParse({
      ...request,
      messages: [{ role: 'assistant', content: 'Hello' }],
    }).success,
    false,
  )
})

test('Groq receives context before conversation and returns validated JSON without exposing credentials', async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions')
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer test-key')
    const body = JSON.parse(String(init?.body))
    assert.equal(body.model, 'openai/gpt-oss-20b')
    assert.equal(body.response_format.json_schema.strict, true)
    assert.equal(body.max_completion_tokens, 1024)
    assert.equal(body.messages[1].role, 'system')
    assert.ok(body.messages[1].content.includes(JSON.stringify(request.context)))
    assert.equal(body.messages.at(-1).content, 'How is my progress?')
    return completion(reply)
  }
  assert.deepEqual(await generateGroqReply(request, { apiKey: 'test-key', fetcher }), reply)
})

test('provider failures, malformed JSON and incomplete replies fail safely', async () => {
  for (const [status, expected] of [
    [429, 429],
    [401, 503],
    [403, 503],
    [500, 502],
  ]) {
    await assert.rejects(
      generateGroqReply(request, {
        apiKey: 'test-key',
        fetcher: async () => new Response('secret provider diagnostic', { status }),
      }),
      (error: unknown) =>
        error instanceof GroqServiceError &&
        error.status === expected &&
        !error.message.includes('secret'),
    )
  }
  for (const response of [
    completion({ bad: true }),
    completion(reply, 'length'),
    Response.json({ choices: [] }),
  ]) {
    await assert.rejects(
      generateGroqReply(request, { apiKey: 'test-key', fetcher: async () => response }),
      (error: unknown) => error instanceof GroqServiceError && error.status === 502,
    )
  }
  await assert.rejects(
    generateGroqReply(request, {
      apiKey: '',
      fetcher: async () => {
        throw new Error('Must not call')
      },
    }),
    (error: unknown) => error instanceof GroqServiceError && error.status === 503,
  )
  await assert.rejects(
    generateGroqReply(request, {
      apiKey: 'test-key',
      fetcher: async () => {
        throw new DOMException('Timed out', 'TimeoutError')
      },
    }),
    (error: unknown) => error instanceof GroqServiceError && error.status === 504,
  )
})

test('route rejects cross-origin requests, malformed input and oversized bodies before calling Groq', async () => {
  const url = 'http://localhost:3000/api/coach'
  const cases: Array<{ headers: Record<string, string>; body: string; status: number }> = [
    {
      headers: { 'content-type': 'application/json', origin: 'https://untrusted.example' },
      body: '{}',
      status: 403,
    },
    { headers: { 'content-type': 'text/plain' }, body: '{}', status: 415 },
    { headers: { 'content-type': 'application/json' }, body: '{broken', status: 400 },
    { headers: { 'content-type': 'application/json' }, body: '{}', status: 400 },
    { headers: { 'content-type': 'application/json' }, body: 'x'.repeat(25000), status: 413 },
  ]
  for (const item of cases) {
    const response = await POST(
      new Request(url, { method: 'POST', headers: item.headers, body: item.body }),
    )
    assert.equal(response.status, item.status)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  }
})
