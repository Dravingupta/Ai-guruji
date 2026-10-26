const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const string = { type: 'string' };
const number = { type: 'number' };
const array = items => ({ type: 'array', items });
const meal = object({
    name: string, slotId: string, type: { type: 'string', enum: ['breakfast', 'lunch', 'snack', 'dinner', 'other'] },
    calories: number, proteinGrams: number, carbsGrams: number, fatsGrams: number,
    shortDescription: string,
    recipeDetail: object({ ingredients: array(object({ name: string, quantity: string })), steps: array(string), prepTime: string, cookTime: string })
});
const schemas = {
    targets: object({ calories: number, proteinGrams: number, carbsGrams: number, fatsGrams: number }),
    diet: object({ totalCalories: number, meals: array(meal), tips: array(string) }),
    meal
};

// Gemini accepts JSON Schema in the Interactions response format.
// Application checks still enforce actual meal counts, arithmetic and target bounds.
export function nutritionSchema(kind) {
    if (!schemas[kind]) throw new Error('Unknown nutrition schema');
    return { ...schemas[kind], title: `nutrition_${kind}` };
}
