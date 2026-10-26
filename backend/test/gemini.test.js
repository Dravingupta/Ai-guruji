import test from 'node:test';
import assert from 'node:assert/strict';
import { geminiModel, geminiTransport } from '../src/services/geminiClient.js';
import { estimateNutritionTargets, generateDietPlan, generateWeeklyWorkoutPlan } from '../src/services/deepseekService.js';

const targets = { calories: 2000, proteinGrams: 130, carbsGrams: 240, fatsGrams: 48 };
const options = { timeout_ms: 60000, retries: { strategy: 'none' } };
const completed = text => ({ id: 'test-interaction', status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text }] }] });
function environment(t, values) {
    for (const [key, value] of Object.entries(values)) {
        const previous = process.env[key];
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
        t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    }
}

test('installed Google SDK sends a stateless structured interaction and reads native output', async t => {
    environment(t, { GEMINI_API_KEY: 'fake-sdk-test', GEMINI_MODEL: 'gemini-test-model', GOOGLE_API_KEY: undefined });
    const fetch = t.mock.method(globalThis, 'fetch', async request => {
        assert.match(request.url, /^https:\/\/generativelanguage\.googleapis\.com\/.*\/interactions$/);
        assert.equal(request.headers.get('x-goog-api-key'), 'fake-sdk-test');
        const body = await request.json();
        assert.equal(body.model, 'gemini-test-model');
        assert.equal(body.store, false);
        assert.equal(body.input[0].type, 'user_input');
        assert.match(body.input[0].content[0].text, /"weightKg":108/);
        assert.match(body.system_instruction, /meal-planning assistant/);
        assert.equal(body.generation_config.thinking_level, 'low');
        assert.equal(body.generation_config.max_output_tokens, 2048);
        assert.equal(body.response_format[0].mime_type, 'application/json');
        assert.equal(body.response_format[0].schema.title, 'nutrition_targets');
        return new Response(JSON.stringify(completed(JSON.stringify(targets))), { headers: { 'content-type': 'application/json' } });
    });
    assert.equal((await estimateNutritionTargets({ weight: 108 })).proteinGrams, 130);
    assert.equal(fetch.mock.calls.length, 1);
});

test('SDK 429 is exposed as a retryable user error without an automatic paid replay', async t => {
    environment(t, { GEMINI_API_KEY: 'fake-rate-test', GEMINI_MODEL: undefined });
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '1' } }));
    await assert.rejects(generateDietPlan({ macroMode: 'custom', customMacros: { protein: 130, carbs: 240, fats: 48 } }), error => error.status === 429 && error.code === 'AI_RATE_LIMIT' && /temporarily limited/.test(error.message));
    assert.equal(fetch.mock.calls.length, 1);
});

test('missing key fails locally; GOOGLE_API_KEY and the default model are supported', async t => {
    environment(t, { GEMINI_API_KEY: '', GOOGLE_API_KEY: '', GEMINI_MODEL: '' });
    const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(completed('OK')), { headers: { 'content-type': 'application/json' } }));
    await assert.rejects(geminiTransport.create({ model: geminiModel(), input: 'Hello', store: false }, options), error => error.code === 'AI_CONFIGURATION');
    assert.equal(fetch.mock.calls.length, 0);
    process.env.GOOGLE_API_KEY = 'fake-alternate-key';
    const result = await geminiTransport.create({ model: geminiModel(), input: 'Hello', store: false }, options);
    assert.equal(result.output_text, 'OK');
    assert.equal(geminiModel(), 'gemini-3.6-flash');
    assert.equal(fetch.mock.calls.length, 1);
});

test('incomplete or empty responses never enter nutrition validation or correction', async t => {
    for (const response of [
        { ...completed(JSON.stringify(targets)), status: 'incomplete' },
        { ...completed(JSON.stringify(targets)), status: 'failed' },
        { status: 'completed', steps: [{ type: 'thought', content: [{ type: 'text', text: JSON.stringify(targets) }] }] }
    ]) {
        const create = t.mock.method(geminiTransport, 'create', async () => response);
        await assert.rejects(estimateNutritionTargets({ weight: 108 }), error => error.code === 'AI_UNAVAILABLE');
        assert.equal(create.mock.calls.length, 1);
        assert.deepEqual(create.mock.calls[0].arguments[1], options);
        create.mock.restore();
    }
});

test('weekly workouts use Gemini structured output and retain exercise identifiers', async t => {
    const weekPlan = Array.from({ length: 7 }, () => ({ dayName: 'Monday', focus: 'Strength', exercises: [{ name: 'Squat', sets: '3', reps: '10' }] }));
    const create = t.mock.method(geminiTransport, 'create', async () => completed(JSON.stringify({ weekPlan })));
    const result = await generateWeeklyWorkoutPlan({ goal: 'Fitness', workoutPreference: 'Home' }, '2026-10-26');
    assert.equal(result.length, 7);
    assert.equal(new Set(result.map(day => day.exercises[0].id)).size, 7);
    assert.equal(create.mock.calls[0].arguments[0].response_format[0].mime_type, 'application/json');
});
