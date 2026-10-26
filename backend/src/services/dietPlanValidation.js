import { normalizeNutritionTargets, validateNutritionTotals } from './nutritionTargets.js';
import { MEAL_TYPES, normalizeMealSchedule } from '../contracts/nutrition.js';

export const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

export const normalizeMeal = (meal, expectedType) => {
    const type = String(meal?.type || '').trim().toLowerCase();
    if (!MEAL_TYPES.includes(type) || (expectedType && type !== expectedType) || !meal?.name?.trim()) throw new Error('Meal details are incomplete');
    const normalized = { ...meal, type, name: meal.name.trim() };
    for (const field of ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams']) {
        const value = Number(meal[field]);
        if (meal[field] === null || meal[field] === '' || !Number.isFinite(value) || value < 0 || (field === 'calories' && value === 0)) throw new Error('Meal nutrition is incomplete');
        normalized[field] = Math.round(value);
    }
    const recipe = meal.recipeDetail;
    if (!recipe?.ingredients?.length || !recipe?.steps?.length || !recipe.ingredients.every(item => typeof item.name === 'string' && item.name.trim() && typeof item.quantity === 'string' && item.quantity.trim()) || !recipe.steps.every(step => typeof step === 'string' && step.trim())) throw new Error('Meal recipe is incomplete');
    return normalized;
};

export const normalizeDietPlan = (plan, requiredTargets, requiredSchedule) => {
    const schedule = normalizeMealSchedule(requiredSchedule || plan?.mealSchedule);
    const legacy = !requiredSchedule && !plan?.mealSchedule;
    if (!Array.isArray(plan?.meals) || plan.meals.length !== schedule.length) throw new Error(`A daily plan must include exactly ${schedule.length} scheduled meals`);
    const seen = new Set();
    const meals = plan.meals.map(meal => {
        const slot = schedule.find(slot => meal.slotId ? slot.id === meal.slotId : legacy && slot.type === String(meal.type).toLowerCase());
        if (!slot || seen.has(slot.id)) throw new Error('A daily plan must contain each scheduled meal exactly once');
        seen.add(slot.id);
        const normalized = normalizeMeal(meal, slot.type);
        return { ...normalized, slotId: slot.id, label: slot.label, time: slot.time };
    });
    meals.sort((a, b) => schedule.findIndex(slot => slot.id === a.slotId) - schedule.findIndex(slot => slot.id === b.slotId));
    const result = { mealSchedule: schedule, meals, totalCalories: meals.reduce((total, meal) => total + meal.calories, 0), tips: Array.isArray(plan.tips) ? plan.tips.filter(tip => typeof tip === 'string') : [] };
    if (requiredTargets) {
        const targets = normalizeNutritionTargets(requiredTargets, requiredTargets.source);
        validateNutritionTotals(meals, targets);
        result.nutritionTargets = targets;
    }
    return result;
};
