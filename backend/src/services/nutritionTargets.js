export const MACRO_FIELDS = ['proteinGrams', 'carbsGrams', 'fatsGrams'];

export function normalizeNutritionTargets(input, source = 'auto') {
    const targets = { source };
    for (const field of ['calories', ...MACRO_FIELDS]) {
        const value = input?.[field];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`Daily ${field} target must be a positive number`);
        targets[field] = Math.round(value);
        if (targets[field] <= 0) throw new Error(`Daily ${field} target must be positive`);
    }
    const energy = targets.proteinGrams * 4 + targets.carbsGrams * 4 + targets.fatsGrams * 9;
    if (Math.abs(energy - targets.calories) > targets.calories * 0.1) throw new Error('Daily macro targets do not match the calorie target');
    return targets;
}

export function customNutritionTargets(profile) {
    const macros = profile.customMacros || {};
    const calories = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
    return normalizeNutritionTargets({ calories, proteinGrams: macros.protein, carbsGrams: macros.carbs, fatsGrams: macros.fats }, 'custom');
}

export function mealTargetBudgets(targets, schedule) {
    const weights = schedule.map(slot => slot.type === 'snack' ? 0.5 : 1);
    const weight = weights.reduce((sum, value) => sum + value, 0);
    const remaining = { ...targets };
    return schedule.map((slot, index) => ({ slotId: slot.id, ...Object.fromEntries(['calories', ...MACRO_FIELDS].map(field => {
        const value = index === schedule.length - 1 ? remaining[field] : Math.round(targets[field] * weights[index] / weight);
        remaining[field] -= value;
        return [field, value];
    })) }));
}

export function validateNutritionTotals(meals, targets) {
    const totals = meals.reduce((sum, meal) => {
        for (const field of ['calories', ...MACRO_FIELDS]) sum[field] += meal[field];
        return sum;
    }, { calories: 0, proteinGrams: 0, carbsGrams: 0, fatsGrams: 0 });
    // Protein is a minimum, not a loose percentage band that accepts a shortfall.
    if (totals.proteinGrams < targets.proteinGrams || totals.proteinGrams > targets.proteinGrams * 1.15) {
        throw new Error(`Meals provide ${totals.proteinGrams} g protein; required ${targets.proteinGrams}–${Math.floor(targets.proteinGrams * 1.15)} g`);
    }
    for (const field of ['calories', 'carbsGrams', 'fatsGrams']) {
        const tolerance = field === 'calories' ? 0.1 : 0.15;
        if (Math.abs(totals[field] - targets[field]) > targets[field] * tolerance) throw new Error(`Meals provide ${totals[field]} ${field}; daily target is ${targets[field]} (within ${tolerance * 100}%)`);
    }
    for (const meal of meals) {
        const energy = meal.proteinGrams * 4 + meal.carbsGrams * 4 + meal.fatsGrams * 9;
        if (Math.abs(energy - meal.calories) > meal.calories * 0.15) throw new Error(`${meal.type} calories do not match its macros (declared ${meal.calories} kcal; macro energy ${energy} kcal). Correct the portions and all nutrition fields consistently`);
    }
    return totals;
}
