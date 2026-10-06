import type { z } from 'zod'
import type { userSessionSchema, runnerDataSchema } from '@/features/running-coach/storage-schema'

export type UserSession = z.infer<typeof userSessionSchema>
export type RunnerData = z.infer<typeof runnerDataSchema>
export type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
