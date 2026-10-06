import 'server-only'
import { z } from 'zod'

const groqApiKeySchema = z.string().trim().min(1)

export function getGroqApiKey(): string | undefined {
  const result = groqApiKeySchema.safeParse(process.env.GROQ_API_KEY)
  return result.success ? result.data : undefined
}
