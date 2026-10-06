import type { StorageAccess } from '@/types/runner'

export function getBrowserStorage(): StorageAccess | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
