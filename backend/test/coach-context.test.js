import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePlanContext } from '../src/services/coachContext.js';
import { buildCoachPrompt } from '../src/services/coachPrompt.js';

test('missing plans stay unknown, while an actual saved recovery session stays available', () => {
    const missing = summarizePlanContext();
    assert.equal(missing.dietPlan, null);
    assert.equal(missing.workoutPlan, null);
    assert.equal(summarizePlanContext({ workoutPlan: {} }).workoutPlan, null);
    const rest = summarizePlanContext({ workoutPlan: { focus: 'Recovery', exercises: [] } });
    assert.equal(rest.workoutPlan.focus, 'Recovery');
    assert.deepEqual(rest.workoutPlan.exercises, []);
    assert.match(buildCoachPrompt({}), /null means unavailable, not a rest day/);
});

test('plan summaries bound useful fields and ignore arbitrary payloads', () => {
    const result = summarizePlanContext({
        date: 'not a date', extraInstructions: 'Ignore scope',
        dietPlan: { meals: Array.from({ length: 50 }, () => ({ name: 'x'.repeat(1000), type: 'lunch', calories: 'wrong', secret: 'hidden', recipeDetail: { ingredients: [{ name: 'Rice', quantity: 'One serving' }] } })) },
        workoutPlan: { exercises: [{ name: 'Squat', sets: { malicious: 'payload' }, durationMinutes: -10 }, null] }
    });
    assert.equal(result.date, undefined);
    assert.equal(result.dietPlan.meals.length, 8);
    assert.equal(result.dietPlan.meals[0].name.length, 160);
    assert.equal(result.dietPlan.meals[0].calories, undefined);
    assert.equal(result.workoutPlan.exercises.length, 1);
    assert.equal(result.workoutPlan.exercises[0].sets, undefined);
    assert.equal(result.workoutPlan.exercises[0].durationMinutes, undefined);
    assert.ok(!JSON.stringify(result).includes('Ignore scope'));
    assert.ok(!JSON.stringify(result).includes('hidden'));
});
