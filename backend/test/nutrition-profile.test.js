import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiTransport } from '../src/services/geminiClient.js';
import User from '../src/models/User.js';
import DietPlan from '../src/models/DietPlan.js';
import WeightCheckIn from '../src/models/WeightCheckIn.js';
import { resolveNutritionProfile } from '../src/services/nutritionProfileService.js';
import { normalizeDietPlan } from '../src/services/dietPlanValidation.js';
import { createOrUpdateProfile } from '../src/controllers/userController.js';
import { createDietPlan } from '../src/controllers/dietController.js';
import { generateDietPlan, swapMeal } from '../src/services/deepseekService.js';
import { defaultMealSchedule, normalizeMealSchedule, targetInputKey, nutritionProfileKey, weightNeedsTargetReview } from '../src/contracts/nutrition.js';
const targets = { source: 'auto', calories: 2000, proteinGrams: 130, carbsGrams: 240, fatsGrams: 48 };
const initial = () => ({ uid: 'owner', name: 'Test', email: 'test@example.com', age: 30, gender: 'Male', weight: 108, height: 180, goal: 'Fat Loss', activityLevel: 'Lightly Active', macroMode: 'auto', mealSchedule: defaultMealSchedule(), nutritionWeightReviewPercent: 5 });
const response = value => ({ status: 'completed', output_text: JSON.stringify(value) });
const res = () => ({ code: 200, status(code) { this.code = code; return this; }, json(value) { this.data = value; return this; } });
const request = body => ({ user: { uid: 'owner' }, body });
const split = (value, index, count) => Math.floor(value / count) + (index < value % count ? 1 : 0);
const menu = schedule => ({ meals: schedule.map((slot, index) => ({ id: `meal-${index}`, slotId: slot.id, type: slot.type, name: `${slot.label} meal`, ...Object.fromEntries(['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams'].map(key => [key, split(targets[key], index, schedule.length)])), recipeDetail: { ingredients: [{ name: 'Sample food', quantity: '150 g cooked' }], steps: ['Prepare and serve.'] } })) });
function harness(t, profile = initial()) {
    let data = structuredClone(profile), measurement = null;
    t.mock.method(User, 'findOne', async filter => filter.uid === data?.uid ? structuredClone(data) : null);
    const update = t.mock.method(User, 'findOneAndUpdate', async (filter, input) => {
        if (data && filter.weight !== undefined && filter.weight !== data.weight) return null;
        if (data && filter.nutritionProfileKey !== undefined) {
            const expected = filter.nutritionProfileKey;
            if (typeof expected === 'object' ? data.nutritionProfileKey !== undefined : data.nutritionProfileKey !== expected) return null;
        }
        data = { ...data, ...(input.$set || input) }; return structuredClone(data);
    });
    t.mock.method(WeightCheckIn, 'findOne', () => ({ sort: () => ({ lean: async () => measurement }) }));
    const previous = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = 'test-key';
    t.after(() => { if (previous === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous; });
    return { get profile() { return data; }, patch(values) { data = { ...data, ...values }; data.nutritionProfileKey = nutritionProfileKey(data); }, measure(weightKg) { measurement = { weightKg, date: '2026-10-26', status: 'measured' }; }, update };
}
function cachedProfile() {
    const profile = initial();
    return { ...profile, nutritionProfileKey: nutritionProfileKey(profile), nutritionTargets: targets, nutritionTargetInputKey: targetInputKey(profile), nutritionTargetBasis: { weightKg: 108 }, nutritionTargetsUpdatedAt: '2026-10-20' };
}
test('targets are estimated once and persisted on the owned profile for reuse', async t => {
    const store = harness(t), post = t.mock.method(geminiTransport, 'create', async () => response(targets));
    const first = await resolveNutritionProfile('owner'), second = await resolveNutritionProfile('owner');
    assert.equal(post.mock.calls.length, 1); assert.equal(store.update.mock.calls.length, 1);
    assert.equal(first.profile.nutritionTargets.proteinGrams, 130); assert.equal(second.profile.nutritionTargetBasis.weightKg, 108);
    assert.equal(store.update.mock.calls[0].arguments[0].uid, 'owner');
});
test('concurrent nutrition requests share one target estimation', async t => {
    harness(t); const post = t.mock.method(geminiTransport, 'create', async () => { await new Promise(resolve => setTimeout(resolve, 15)); return response(targets); });
    await Promise.all([resolveNutritionProfile('owner'), resolveNutritionProfile('owner')]); assert.equal(post.mock.calls.length, 1);
});
test('schedule, food preferences and small weight changes reuse targets; goal/activity changes refresh them', async t => {
    const store = harness(t, cachedProfile()), post = t.mock.method(geminiTransport, 'create', async () => response(targets));
    store.patch({ name: 'New name', dietaryPreference: 'Vegan', mealSchedule: defaultMealSchedule(5), weight: 107 }); store.measure(104);
    await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 0);
    store.patch({ activityLevel: 'Very Active' }); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 1);
    store.patch({ goal: 'Muscle Gain' }); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 2);
});
test('significant weight change compares against the saved target basis and resets that basis', async t => {
    const store = harness(t, cachedProfile()), post = t.mock.method(geminiTransport, 'create', async () => response(targets));
    store.measure(104); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 0);
    store.measure(102.6); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 1);
    assert.equal(store.profile.nutritionTargetBasis.weightKg, 102.6);
    store.measure(102); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 1);
    store.patch({ nutritionWeightReviewPercent: 3 }); store.measure(99); await resolveNutritionProfile('owner'); assert.equal(post.mock.calls.length, 2);
});
test('custom targets stay authoritative after large weight changes without AI estimation', async t => {
    const store = harness(t, { ...initial(), macroMode: 'custom', customMacros: { protein: 130, carbs: 240, fats: 48 } });
    const post = t.mock.method(geminiTransport, 'create', () => { throw new Error('Custom targets must not call AI'); });
    await resolveNutritionProfile('owner'); store.measure(90); await resolveNutritionProfile('owner');
    assert.equal(post.mock.calls.length, 0); assert.equal(store.profile.nutritionTargets.calories, 1912); assert.equal(store.profile.nutritionTargets.source, 'custom');
});
test('failed estimation preserves previous targets; concurrent profile changes prevent stale target writes', async t => {
    const store = harness(t, cachedProfile()); store.patch({ goal: 'Muscle Gain' });
    const original = structuredClone(store.profile.nutritionTargets);
    const post = t.mock.method(geminiTransport, 'create', async () => { throw Object.assign(new Error('Unavailable'), { status: 503 }); });
    await assert.rejects(resolveNutritionProfile('owner')); assert.deepEqual(store.profile.nutritionTargets, original);
    post.mock.mockImplementation(async () => { store.patch({ activityLevel: 'Very Active' }); return response(targets); });
    await assert.rejects(resolveNutritionProfile('owner'), error => error.status === 409); assert.deepEqual(store.profile.nutritionTargets, original);
});
test('profile writes validate schedules and cannot overwrite protected targets or account ownership', async t => {
    const store = harness(t, cachedProfile()), saved = res();
    await createOrUpdateProfile(request({ uid: 'other', name: 'Updated', nutritionTargets: { proteinGrams: 1 }, nutritionTargetInputKey: 'forged', weighInFrequency: 'daily', mealSchedule: defaultMealSchedule(3) }), saved);
    assert.equal(saved.code, 200); assert.equal(store.profile.uid, 'owner'); assert.equal(store.profile.nutritionTargets.proteinGrams, 130); assert.equal(store.profile.mealSchedule.length, 3);
    assert.ok(!Object.hasOwn(store.update.mock.calls[0].arguments[1], 'weighInFrequency'));
    const invalid = res(); await createOrUpdateProfile(request({ mealSchedule: defaultMealSchedule(3).slice(0, 1) }), invalid);
    assert.equal(invalid.code, 400); assert.equal(store.profile.mealSchedule.length, 3);
});
test('profile changes while a menu is generating prevent stale menu storage', async t => {
    const store = harness(t, cachedProfile());
    t.mock.method(geminiTransport, 'create', async () => { store.patch({ mealSchedule: defaultMealSchedule(5) }); return response(menu(defaultMealSchedule())); });
    const save = t.mock.method(DietPlan, 'create', async value => value), output = res();
    await createDietPlan(request({}), output); assert.equal(output.code, 409); assert.equal(save.mock.calls.length, 0);
});
test('two daily generations reuse profile targets and perform only the two meal requests', async t => {
    harness(t, cachedProfile()); const post = t.mock.method(geminiTransport, 'create', async () => response(menu(defaultMealSchedule())));
    const save = t.mock.method(DietPlan, 'create', async value => value);
    for (let day = 0; day < 2; day++) { const output = res(); await createDietPlan(request({}), output); assert.equal(output.code, 200); assert.equal(output.data.nutritionTargets.proteinGrams, 130); assert.ok(output.data.nutritionProfileKey); }
    assert.equal(post.mock.calls.length, 2); assert.equal(save.mock.calls.length, 2);
    assert.ok(post.mock.calls.every(call => call.arguments[0].response_format[0].schema.title === 'nutrition_diet'));
});
test('two, three, five and six meals retain schedule order, labels and independent snack slots', async t => {
    harness(t);
    for (const count of [2, 3, 5, 6]) {
        const schedule = defaultMealSchedule(count); schedule[0].label = 'My first meal'; schedule[0].time = '09:30';
        const post = t.mock.method(geminiTransport, 'create', async () => response(menu(schedule)));
        const result = await generateDietPlan({ ...initial(), mealSchedule: schedule }, targets);
        assert.equal(result.meals.length, count); assert.equal(result.meals[0].label, 'My first meal'); assert.equal(result.meals[0].time, '09:30');
        assert.equal(result.meals.reduce((sum, meal) => sum + meal.proteinGrams, 0), 130); assert.equal(new Set(result.meals.map(meal => meal.slotId)).size, count); assert.equal(post.mock.calls.length, 1); post.mock.restore();
    }
    const schedule = defaultMealSchedule(5), duplicated = menu(schedule); duplicated.meals[3].slotId = duplicated.meals[1].slotId;
    assert.throws(() => normalizeDietPlan(duplicated, targets, schedule), /exactly once/);
    assert.throws(() => normalizeDietPlan({ meals: menu(schedule).meals.slice(1) }, targets, schedule), /exactly 5/);
});
test('swapping one snack keeps its slot and leaves a second snack unchanged', async t => {
    harness(t); const schedule = defaultMealSchedule(5), plan = normalizeDietPlan(menu(schedule), targets, schedule), original = plan.meals[3];
    const replacement = { ...original, name: 'New afternoon snack' }, post = t.mock.method(geminiTransport, 'create', async () => response(replacement));
    const swapped = await swapMeal(initial(), original, plan);
    assert.equal(swapped.slotId, original.slotId); assert.equal(swapped.label, original.label); assert.notEqual(swapped.id, original.id); assert.equal(plan.meals[1].name, 'Morning snack meal');
    post.mock.mockImplementation(async () => response({ ...replacement, slotId: plan.meals[1].slotId })); await assert.rejects(swapMeal(initial(), original, plan));
});
test('legacy schedules default to four, and malformed schedule times/identifiers are rejected', () => {
    assert.equal(normalizeMealSchedule(undefined).length, 4);
    assert.throws(() => normalizeMealSchedule([...defaultMealSchedule(3), defaultMealSchedule(3)[0]]));
    assert.throws(() => normalizeMealSchedule([{ ...defaultMealSchedule(3)[0], time: '25:00' }, ...defaultMealSchedule(3).slice(1)]));
    assert.equal(weightNeedsTargetReview(cachedProfile(), 104), false); assert.equal(weightNeedsTargetReview(cachedProfile(), 102.6), true);
});


test('concurrent daily requests share meal generation and write a single snapshot', async t => {
    harness(t, cachedProfile());
    const post = t.mock.method(geminiTransport, 'create', async () => { await new Promise(resolve => setTimeout(resolve, 15)); return response(menu(defaultMealSchedule())); });
    const save = t.mock.method(DietPlan, 'create', async value => value);
    const first = res(), second = res();
    await Promise.all([createDietPlan(request({}), first), createDietPlan(request({}), second)]);
    assert.equal(first.code, 200); assert.equal(second.code, 200);
    assert.equal(post.mock.calls.length, 1); assert.equal(save.mock.calls.length, 1);
    assert.deepEqual(first.data, second.data);
});

test('profile and plan schemas persist reusable targets and repeated scheduled snack slots', () => {
    const profile = { ...cachedProfile(), mealSchedule: defaultMealSchedule(5) };
    const savedUser = new User(profile);
    assert.equal(savedUser.validateSync(), undefined);
    const serialized = savedUser.toObject();
    assert.equal(serialized.mealSchedule[1].type, 'snack'); assert.equal(serialized.mealSchedule[3].type, 'snack');
    assert.equal(serialized.nutritionTargets.proteinGrams, 130); assert.equal(serialized.nutritionWeightReviewPercent, 5);
    const savedPlan = new DietPlan({ userId: 'owner', date: '2026-10-26', ...normalizeDietPlan(menu(profile.mealSchedule), targets, profile.mealSchedule), nutritionProfileKey: nutritionProfileKey(profile) });
    assert.equal(savedPlan.validateSync(), undefined);
    assert.equal(savedPlan.toObject().meals[3].slotId, 'snack');
    assert.equal(savedPlan.toObject().mealSchedule.length, 5);
});


import * as browserNutrition from '../../client/src/contracts/nutrition.js';
test('independently deployed browser and API nutrition contracts produce identical wire values', () => {
    for (const count of [2, 3, 4, 5, 6]) {
        const schedule = defaultMealSchedule(count);
        assert.deepEqual(browserNutrition.defaultMealSchedule(count), schedule);
        assert.deepEqual(browserNutrition.normalizeMealSchedule(schedule), normalizeMealSchedule(schedule));
        const profile = { ...cachedProfile(), mealSchedule: schedule, allergies: ['Soy', 'Peanuts'] };
        assert.equal(browserNutrition.targetInputKey(profile), targetInputKey(profile));
        assert.equal(browserNutrition.nutritionProfileKey(profile), nutritionProfileKey(profile));
        for (const weight of [100, 102.6, 104, 108, 113.4]) assert.equal(browserNutrition.weightNeedsTargetReview(profile, weight), weightNeedsTargetReview(profile, weight));
    }
});
