import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { getGreetingResponse } from '../src/services/coachPrompt.js';
import { normalizeDietPlan, normalizeMeal } from '../src/services/dietPlanValidation.js';
import { chatWithCoach, generateDietPlan, swapMeal } from '../src/services/deepseekService.js';

const meal = type => ({ type, name: `${type} meal`, calories: 400, proteinGrams: 20, carbsGrams: 50, fatsGrams: 13, recipeDetail: { ingredients: [{ name: 'Ingredient', quantity: '1 portion' }], steps: ['Prepare and serve.'] } });
const plan = () => ({ totalCalories: 9999, meals: ['dinner', 'snack', 'breakfast', 'lunch'].map(meal) });

test('plain greetings stay short even after a long historical reply and never call the provider', async t => {
    t.mock.method(axios, 'post', () => { throw new Error('Greeting must not call Groq'); });
    for (const message of ['hi', 'Hiii!', 'Hello.', 'hey coach', 'Namaste Guruji', 'good morning']) {
        assert.equal(await chatWithCoach({ name: 'Aarav Sharma' }, [{ role: 'model', text: '**Current stats**\nA very long profile report.' }], message), 'Hi Aarav! How can I help you today?');
    }
    assert.equal(axios.post.mock.calls.length, 0);
    assert.equal(getGreetingResponse({}, 'hi'), 'Hi! How can I help you today?');
    assert.equal(getGreetingResponse({}, 'Hi, how can I get more protein?'), null);
});

test('normalizes a full day into meal order and derives calories from its meals', () => {
    const original = plan();
    const result = normalizeDietPlan(original);
    assert.deepEqual(result.meals.map(item => item.type), ['breakfast', 'lunch', 'snack', 'dinner']);
    assert.equal(result.totalCalories, 1600);
    assert.equal(original.totalCalories, 9999);
});

test('rejects missing meals, duplicate slots, invalid nutrition, and incomplete recipes', () => {
    const missing = plan(); missing.meals.pop(); assert.throws(() => normalizeDietPlan(missing));
    const duplicate = plan(); duplicate.meals[0].type = 'lunch'; assert.throws(() => normalizeDietPlan(duplicate));
    for (const value of [null, '', -1, NaN, 'unknown']) assert.throws(() => normalizeMeal({ ...meal('lunch'), calories: value }));
    assert.throws(() => normalizeMeal({ ...meal('lunch'), recipeDetail: { ingredients: [], steps: [] } }));
    assert.throws(() => normalizeMeal(meal('dinner'), 'lunch'));
});

test('diet service accepts only complete provider results and retains profile constraints', async t => {
    const oldKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = 'test-key';
    t.after(() => { if (oldKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = oldKey; });
    const post = t.mock.method(axios, 'post', async () => ({ data: { choices: [{ message: { content: JSON.stringify(plan()) } }] } }));
    const result = await generateDietPlan({ name: 'Test', dietaryPreference: 'Vegan', allergies: ['Peanuts'], height: 178, weight: 74, activityLevel: 'Moderate' });
    assert.equal(result.meals.length, 4);
    assert.equal(new Set(result.meals.map(item => item.id)).size, 4);
    const request = post.mock.calls[0].arguments[1];
    assert.match(request.messages[1].content, /Vegan/);
    assert.match(request.messages[1].content, /Peanuts/);
    assert.match(request.messages[1].content, /178 cm/);
    assert.equal(request.response_format.type, 'json_object');
    post.mock.mockImplementation(async () => ({ data: { choices: [{ message: { content: JSON.stringify({ meals: [meal('breakfast')] }) } }] } }));
    await assert.rejects(generateDietPlan({}), /complete meal plan/);
    post.mock.mockImplementation(async () => { throw { response: { status: 503 } }; });
    await assert.rejects(swapMeal({}, meal('lunch')), /alternative could not/);
});
