import test from 'node:test';
import assert from 'node:assert/strict';
import { retainLoggedMeals } from '../src/utils/mealPlanReplacement.js';

test('replacing a plan retains logged nutrition, manual entries, and exercise tracking', () => {
  const eaten = { id: 'breakfast', type: 'breakfast', calories: 400, name: 'Oats' };
  const untouched = { id: 'lunch', type: 'lunch', calories: 600 };
  const extra = { id: 'manual_1', calories: 100 };
  const tracking = { completedMealIds: ['breakfast', 'manual_1'], completedExerciseIds: ['exercise_1'], totalTargetCalories: 1800, totalEstimatedCaloriesConsumed: 500, totalEstimatedCaloriesBurned: 60, netCalories: 440 };
  const replacement = retainLoggedMeals({ meals: [eaten, untouched] }, [extra], tracking, { totalCalories: 2000 });
  assert.deepEqual(replacement.journal.map(item => item.id), ['manual_1', 'breakfast']);
  assert.equal(replacement.journal[1].timeOfDay, 'breakfast');
  assert.equal(replacement.tracking.totalEstimatedCaloriesConsumed, 500);
  assert.equal(replacement.tracking.netCalories, 440);
  assert.equal(replacement.tracking.totalTargetCalories, 2000);
  assert.equal(replacement.tracking.calorieDeficit, 1500);
  assert.deepEqual(replacement.tracking.completedExerciseIds, ['exercise_1']);
  const repeated = retainLoggedMeals({ meals: [eaten] }, replacement.journal, replacement.tracking, { totalCalories: 1900 });
  assert.equal(repeated.journal.length, 2);
  assert.equal(tracking.totalTargetCalories, 1800);
});
