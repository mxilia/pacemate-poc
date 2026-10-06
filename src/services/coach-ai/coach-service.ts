import type { AIService } from '@/types/coach-ai'
import { mockAIService } from './mock/mock-ai-service'
import { coachApi } from '@/services/api/coach'

export const aiService: AIService = {
  generateCoachResponse: coachApi.generateCoachResponse,
  processNutrition: (request) => mockAIService.processNutrition(request),
  generateOnboardingResponse: (profile, step) =>
    mockAIService.generateOnboardingResponse(profile, step),
  generateRunningPlan: (profile) => mockAIService.generateRunningPlan(profile),
  analyzeRun: (profile, distance, seconds) => mockAIService.analyzeRun(profile, distance, seconds),
  suggestPartners: (profile) => mockAIService.suggestPartners(profile),
}
