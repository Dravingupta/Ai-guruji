// Pure nutrition contract mirrored in client/src/contracts and backend/src/contracts.
// Keep both copies synchronized; cross-package parity tests protect the wire format.
export const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
export const DEFAULT_WEIGHT_REVIEW_PERCENT = 5;
export function defaultMealSchedule(count = 4) {
  const slots = {
    breakfast: { id: 'breakfast', type: 'breakfast', label: 'Breakfast', time: '' },
    lunch: { id: 'lunch', type: 'lunch', label: 'Lunch', time: '' },
    snack: { id: 'snack', type: 'snack', label: 'Afternoon snack', time: '' },
    dinner: { id: 'dinner', type: 'dinner', label: 'Dinner', time: '' },
    morning: { id: 'morning-snack', type: 'snack', label: 'Morning snack', time: '' },
    evening: { id: 'evening-snack', type: 'snack', label: 'Evening snack', time: '' }
  };
  const orders = { 2: ['lunch', 'dinner'], 3: ['breakfast', 'lunch', 'dinner'], 4: ['breakfast', 'lunch', 'snack', 'dinner'], 5: ['breakfast', 'morning', 'lunch', 'snack', 'dinner'], 6: ['breakfast', 'morning', 'lunch', 'snack', 'dinner', 'evening'] };
  if (!orders[count]) throw new Error('Choose between 2 and 6 meals a day');
  return orders[count].map(key => ({ ...slots[key] }));
}
export function normalizeMealSchedule(value) {
  if (value === undefined || value === null) return defaultMealSchedule();
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) throw new Error('Choose between 2 and 6 meals a day');
  const schedule = value.map(slot => {
    if (typeof slot?.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(slot.id)) throw new Error('Meal slots need valid identifiers');
    if (!MEAL_TYPES.includes(slot.type)) throw new Error('Choose a valid meal type');
    if (typeof slot.label !== 'string' || !slot.label.trim() || slot.label.trim().length > 50) throw new Error('Give each meal a label of up to 50 characters');
    const time = slot.time || '';
    if (typeof time !== 'string' || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error('Choose a valid meal time');
    return { id: slot.id, type: slot.type, label: slot.label.trim(), time };
  });
  if (new Set(schedule.map(slot => slot.id)).size !== schedule.length) throw new Error('Each meal slot must have a different identifier');
  return schedule;
}
export function targetInputKey(profile) {
  return JSON.stringify({
    age: Number(profile.age) || null, gender: profile.gender || '', height: Number(profile.height) || null,
    goal: profile.goal || '', activityLevel: profile.activityLevel || '',
    mode: profile.macroMode === 'custom' ? 'custom' : 'auto',
    custom: profile.macroMode === 'custom' ? ['protein', 'carbs', 'fats'].map(key => Number(profile.customMacros?.[key]) || null) : null
  });
}
export function nutritionProfileKey(profile) {
  return JSON.stringify({ targets: targetInputKey(profile), schedule: normalizeMealSchedule(profile.mealSchedule),
    diet: profile.dietaryPreference || '', allergies: [...(profile.allergies || [])].sort(), allergyNotes: profile.allergyNotes || '',
    region: profile.region || '', budget: profile.budgetLevel || '', notes: profile.notes || '' });
}
export function weightReviewPercent(profile) {
  const value = profile.nutritionWeightReviewPercent ?? DEFAULT_WEIGHT_REVIEW_PERCENT;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > 20) throw new Error('Choose a weight-change threshold between 1% and 20%');
  return value;
}
export function weightNeedsTargetReview(profile, weightKg) {
  if (profile.macroMode === 'custom') return false;
  const reference = profile.nutritionTargetBasis?.weightKg;
  return Number.isFinite(reference) && reference > 0 && Number.isFinite(weightKg) &&
    Math.abs(weightKg - reference) / reference * 100 + 1e-9 >= weightReviewPercent(profile);
}
export function planMealSlots(plan) {
  const schedule = normalizeMealSchedule(plan.mealSchedule);
  const used = new Set();
  const slots = schedule.map(slot => {
    const meal = (plan.meals || []).find(item => !used.has(item) && (item.slotId ? item.slotId === slot.id : !plan.mealSchedule && item.type?.toLowerCase() === slot.type));
    if (meal) used.add(meal);
    return { ...slot, meal };
  });
  const extras = (plan.meals || []).filter(meal => !used.has(meal)).map((meal, index) => ({ id: `extra-${meal.id || index}`, type: meal.type || 'other', label: meal.label || meal.type || 'Extra meal', time: '', meal }));
  return { slots, extras };
}
