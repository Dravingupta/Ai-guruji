export const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];

export const normalizeMeal = (meal, expectedType) => {
    const type = String(meal?.type || '').trim().toLowerCase();
    if (!MEAL_ORDER.includes(type) || (expectedType && type !== expectedType) || !meal?.name?.trim()) throw new Error('Meal details are incomplete');
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

export const normalizeDietPlan = plan => {
    if (!Array.isArray(plan?.meals) || plan.meals.length !== MEAL_ORDER.length) throw new Error('A daily plan must include breakfast, lunch, snack, and dinner');
    const meals = plan.meals.map(meal => normalizeMeal(meal));
    if (new Set(meals.map(meal => meal.type)).size !== MEAL_ORDER.length) throw new Error('A daily plan must contain each meal once');
    meals.sort((a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type));
    return { ...plan, meals, totalCalories: meals.reduce((total, meal) => total + meal.calories, 0), tips: Array.isArray(plan.tips) ? plan.tips.filter(tip => typeof tip === 'string') : [] };
};
