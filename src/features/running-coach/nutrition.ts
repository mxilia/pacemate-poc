import type { RunnerData } from '@/types/runner'

export function getNutritionForDate(
  data: Pick<RunnerData, 'mealLogs' | 'nutrition'>,
  date: string,
) {
  const meals = data.mealLogs.filter((log) => log.date === date).map((log) => log.meal)
  const macros = meals.reduce(
    (totals, meal) => ({
      carbs: Math.round((totals.carbs + meal.carbs) * 10) / 10,
      protein: Math.round((totals.protein + meal.protein) * 10) / 10,
      fat: Math.round((totals.fat + meal.fat) * 10) / 10,
    }),
    data.nutrition.date === date
      ? { ...data.nutrition.consumed }
      : { carbs: 0, protein: 0, fat: 0 },
  )
  return { meals, macros, targets: data.nutrition.recommended }
}
