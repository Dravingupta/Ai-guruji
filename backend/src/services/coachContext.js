// The browser owns the current working plans (including local swaps). Keep only
// useful plan fields; these are quoted data, never instructions or verified records.
const text = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) || undefined : undefined;
const scalar = (value, max) => typeof value === 'number' && Number.isFinite(value) ? String(value).slice(0, max) : text(value, max);
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
const list = (value, max, map) => Array.isArray(value) ? value.slice(0, max).map(map).filter(Boolean) : [];

export const summarizePlanContext = input => {
    const context = input && typeof input === 'object' ? input : {};
    const date = text(context.date, 10);
    const meals = list(context.dietPlan?.meals, 8, meal => meal && text(meal.name) ? {
        name: text(meal.name), type: text(meal.type, 24),
        calories: number(meal.calories), proteinGrams: number(meal.proteinGrams),
        carbsGrams: number(meal.carbsGrams), fatsGrams: number(meal.fatsGrams),
        ingredients: list(meal.recipeDetail?.ingredients, 12, item => item && text(item.name) ? { name: text(item.name, 80), quantity: text(item.quantity, 60) } : null)
    } : null);
    const exercises = list(context.workoutPlan?.exercises, 16, exercise => exercise && text(exercise.name) ? {
        name: text(exercise.name), sets: scalar(exercise.sets, 30),
        reps: scalar(exercise.reps, 40), durationMinutes: number(exercise.durationMinutes),
        description: text(exercise.description, 240), notes: text(exercise.notes, 160)
    } : null);
    return {
        date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
        source: 'Browser working plan snapshot; may be incomplete or locally changed',
        dietPlan: context.dietPlan && meals.length ? { totalCalories: number(context.dietPlan.totalCalories), meals } : null,
        workoutPlan: context.workoutPlan && (Array.isArray(context.workoutPlan.exercises) || text(context.workoutPlan.focus)) ? {
            focus: text(context.workoutPlan.focus), duration: text(context.workoutPlan.duration, 40),
            difficulty: text(context.workoutPlan.difficulty, 40), exercises,
            warmup: list(context.workoutPlan.warmup, 8, item => text(item)),
            cooldown: list(context.workoutPlan.cooldown, 8, item => text(item))
        } : null
    };
};
