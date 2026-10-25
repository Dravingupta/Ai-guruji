// Retain consumed meals by their original IDs so completion and calorie totals stay valid.
export function retainLoggedMeals(previousPlan, journal, tracking, nextPlan) {
  const journalIds = new Set(journal.map(meal => meal.id));
  const completed = new Set(tracking.completedMealIds);
  const retained = (previousPlan?.meals || []).filter(meal => completed.has(meal.id) && !journalIds.has(meal.id)).map(meal => ({ ...meal, source: 'manual', timeOfDay: meal.type }));
  return {
    journal: [...journal, ...retained],
    tracking: { ...tracking, totalTargetCalories: nextPlan.totalCalories, calorieDeficit: nextPlan.totalCalories - tracking.totalEstimatedCaloriesConsumed }
  };
}
