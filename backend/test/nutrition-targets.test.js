import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiTransport } from '../src/services/geminiClient.js';
import DietPlan from '../src/models/DietPlan.js';
import { normalizeDietPlan } from '../src/services/dietPlanValidation.js';
import { normalizeNutritionTargets, customNutritionTargets, mealTargetBudgets } from '../src/services/nutritionTargets.js';
import { generateDietPlan, swapMeal } from '../src/services/deepseekService.js';
import { nutritionSchema } from '../src/services/nutritionSchemas.js';

const targets = { calories: 2000, proteinGrams: 130, carbsGrams: 240, fatsGrams: 48, source: 'auto' };
const makePlan = (protein = [32, 33, 32, 33]) => ({
    // Deliberately conflicting totals/notes must not redefine the fixed targets.
    totalCalories: 9999, nutritionTargets: { ...targets, proteinGrams: 87 }, tips: ['Aim for 999 g protein.'],
    meals: ['breakfast', 'lunch', 'snack', 'dinner'].map((type, i) => ({
        id: `meal-${i}`, type, slotId: type, name: `${type} meal`, calories: 500,
        proteinGrams: protein[i], carbsGrams: 60, fatsGrams: 12,
        recipeDetail: { ingredients: [{ name: 'Food', quantity: '150 g cooked' }], steps: ['Prepare and serve.'] }
    }))
});
const response = data => ({ status: 'completed', output_text: JSON.stringify(data) });
function useKey(t) {
    const old = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (old === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = old; });
}

test('87 g cannot satisfy a fixed 130 g target; meal totals cannot lower the target', () => {
    assert.throws(() => normalizeDietPlan(makePlan([22, 22, 22, 21]), targets), /87 g protein; required 130/);
    const good = normalizeDietPlan(makePlan(), targets);
    assert.equal(good.nutritionTargets.proteinGrams, 130);
    assert.equal(good.meals.reduce((sum, meal) => sum + meal.proteinGrams, 0), 130);
    assert.equal(good.totalCalories, 2000);
    const persisted = new DietPlan({ userId: 'test', date: '2026-10-26', ...good }).toObject();
    assert.equal(persisted.nutritionTargets.proteinGrams, 130);
});

test('invalid or internally inconsistent targets and inflated nutrition fail validation', () => {
    for (const proteinGrams of [0, -1, NaN, Infinity, null, '130']) assert.throws(() => normalizeNutritionTargets({ ...targets, proteinGrams }));
    assert.throws(() => normalizeNutritionTargets({ ...targets, calories: 500 }), /do not match/);
    const wrongEnergy = makePlan(); wrongEnergy.meals[0].calories = 100; wrongEnergy.meals[1].calories = 900;
    assert.throws(() => normalizeDietPlan(wrongEnergy, targets), /calories do not match/);
    const excess = makePlan([50, 50, 50, 50]);
    assert.throws(() => normalizeDietPlan(excess, targets), /protein/);
    const wrongCarbs = makePlan(); wrongCarbs.meals[0].carbsGrams = 150;
    assert.throws(() => normalizeDietPlan(wrongCarbs, targets), /carbsGrams/);
});

test('custom targets are authoritative and calories derive from the saved macros', () => {
    const custom = customNutritionTargets({ customMacros: { protein: 130, carbs: 240, fats: 48 } });
    assert.deepEqual(custom, { ...targets, calories: 1912, source: 'custom' });
    assert.throws(() => customNutritionTargets({ customMacros: { protein: 130 } }));
});

test('nutrition schemas require complete typed fields for Gemini structured output', () => {
    const schema = nutritionSchema('diet');
    assert.equal(schema.title, 'nutrition_diet');
    assert.deepEqual(schema.required, ['totalCalories', 'meals', 'tips']);
    assert.equal(schema.properties.meals.items.additionalProperties, false);
    assert.throws(() => nutritionSchema('unknown'));
});

test('108 kg profile resolves targets first, corrects an 87 g day, and returns only a checked plan', async t => {
    useKey(t);
    const sequence = [targets, makePlan([22, 22, 22, 21]), makePlan()];
    const post = t.mock.method(geminiTransport, 'create', async () => response(sequence.shift()));
    const result = await generateDietPlan({ name: 'Test', weight: 108, height: 180, age: 30, gender: 'Male', goal: 'Fat Loss', dietaryPreference: 'Vegetarian' });
    assert.equal(post.mock.calls.length, 3);
    assert.equal(result.nutritionTargets.proteinGrams, 130);
    assert.equal(result.totalCalories, 2000);
    assert.deepEqual(result.tips, []);
    assert.equal(new Set(result.meals.map(meal => meal.id)).size, 4);
    assert.match(post.mock.calls[0].arguments[0].input[0].content[0].text, /"weightKg":108/);
    assert.match(post.mock.calls[1].arguments[0].input[0].content[0].text, /protein MUST reach 130 g/);
    assert.match(post.mock.calls[2].arguments[0].input.at(-1).content[0].text, /87 g protein; required 130/);
});

test('repeated shortfalls fail without returning a saveable plan; provider failures are not retried', async t => {
    useKey(t);
    let calls = 0;
    const post = t.mock.method(geminiTransport, 'create', async () => response(calls++ === 0 ? targets : makePlan([22, 22, 22, 21])));
    await assert.rejects(generateDietPlan({ weight: 108, height: 180 }), /complete meal plan could not/);
    assert.equal(post.mock.calls.length, 3);
    post.mock.mockImplementation(async () => { throw Object.assign(new Error('Unavailable'), { status: 503 }); });
    const before = post.mock.calls.length;
    await assert.rejects(generateDietPlan({ weight: 108 }), /AI service temporarily unavailable/);
    assert.equal(post.mock.calls.length - before, 1);
});

test('custom mode skips target estimation and validates meals against saved numbers', async t => {
    useKey(t);
    const post = t.mock.method(geminiTransport, 'create', async () => response(makePlan()));
    const result = await generateDietPlan({ macroMode: 'custom', customMacros: { protein: 130, carbs: 240, fats: 48 } });
    assert.equal(post.mock.calls.length, 1);
    assert.equal(result.nutritionTargets.source, 'custom');
    assert.equal(result.nutritionTargets.calories, 1912);
});

test('malformed completed JSON uses the same single correction allowance', async t => {
    useKey(t);
    let calls = 0;
    const post = t.mock.method(geminiTransport, 'create', async () => {
        if (calls++ === 0) return { status: 'completed', output_text: 'not json' };
        return response(makePlan());
    });
    const result = await generateDietPlan({ macroMode: 'custom', customMacros: { protein: 130, carbs: 240, fats: 48 } });
    assert.equal(post.mock.calls.length, 2);
    assert.equal(result.nutritionTargets.proteinGrams, 130);
});

test('swaps must preserve whole-day targets, including after multiple substitutions', async t => {
    useKey(t);
    const original = { ...makePlan(), nutritionTargets: targets };
    const bad = { ...original.meals[0], proteinGrams: 5 };
    const good = { ...original.meals[0], name: 'Another meal', proteinGrams: 33 };
    const sequence = [bad, good];
    const post = t.mock.method(geminiTransport, 'create', async () => response(sequence.shift()));
    const replacement = await swapMeal({ dietaryPreference: 'Vegetarian' }, original.meals[0], original);
    assert.equal(post.mock.calls.length, 2);
    const updated = { ...original, meals: [replacement, ...original.meals.slice(1)] };
    assert.equal(normalizeDietPlan(updated, targets).meals.reduce((sum, meal) => sum + meal.proteinGrams, 0), 131);
    post.mock.mockImplementation(async () => response(bad));
    await assert.rejects(swapMeal({}, replacement, updated), /alternative could not/);
});


test('per-slot budget guidance preserves every daily total without changing the saved targets', () => {
    const schedule = [{ id: 'breakfast', type: 'breakfast' }, { id: 'am-snack', type: 'snack' }, { id: 'lunch', type: 'lunch' }, { id: 'pm-snack', type: 'snack' }, { id: 'dinner', type: 'dinner' }];
    const budgets = mealTargetBudgets(targets, schedule);
    for (const field of ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams']) assert.equal(budgets.reduce((sum, meal) => sum + meal[field], 0), targets[field]);
    assert.ok(budgets[1].calories < budgets[0].calories);
    assert.equal(targets.proteinGrams, 130);
});
