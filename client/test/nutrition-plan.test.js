import test from 'node:test';
import assert from 'node:assert/strict';
import { nutritionPlanStatus } from '../src/utils/nutritionPlan.js';

const targets = { calories: 2000, proteinGrams: 130, carbsGrams: 240, fatsGrams: 48 };
const plan = protein => ({ nutritionTargets: targets, meals: protein.map(proteinGrams => ({ calories: 500, proteinGrams, carbsGrams: 60, fatsGrams: 12 })) });

test('Nutrition exposes the exact 43 g shortfall instead of treating four meals as a complete recommendation', () => {
  const state = nutritionPlanStatus(plan([22, 22, 22, 21]));
  assert.equal(state.totals.proteinGrams, 87);
  assert.equal(state.targets.proteinGrams, 130);
  assert.equal(state.proteinShortfall, 43);
  assert.equal(state.needsUpdate, true);
  assert.equal(nutritionPlanStatus(plan([32, 33, 32, 33])).needsUpdate, false);
});

test('legacy and partial target data are marked unchecked without inventing a target from old notes', () => {
  const old = { ...plan([22, 22, 22, 21]), nutritionTargets: undefined, tips: ['Eat 130 g protein'] };
  assert.equal(nutritionPlanStatus(old).needsUpdate, true);
  assert.equal(nutritionPlanStatus(old).targets, null);
  assert.equal(nutritionPlanStatus({ ...old, nutritionTargets: {} }).needsUpdate, true);
});

import { defaultMealSchedule, planMealSlots, nutritionProfileKey, targetInputKey } from '../src/contracts/nutrition.js';
import { retainLoggedMeals } from '../src/utils/mealPlanReplacement.js';

test('five meals render as five distinct slots even with two snacks; legacy meals keep their default slots', () => {
  const schedule = defaultMealSchedule(5);
  const meals = schedule.map(slot => ({ id: slot.id, slotId: slot.id, type: slot.type, name: slot.label, calories: 400 }));
  const { slots, extras } = planMealSlots({ mealSchedule: schedule, meals });
  assert.equal(slots.length, 5); assert.equal(extras.length, 0);
  assert.equal(slots[1].meal.name, 'Morning snack'); assert.equal(slots[3].meal.name, 'Afternoon snack');
  assert.equal(planMealSlots({ meals: [{ id: 'old-breakfast', type: 'breakfast' }] }).slots[0].meal.id, 'old-breakfast');
  assert.equal(planMealSlots({ mealSchedule: defaultMealSchedule(3), meals }).slots.length, 3);
});

test('profile/schedule/target edits mark cached menus outdated without altering their saved snapshots', () => {
  const profile = { weight: 108, height: 180, age: 30, goal: 'Fat Loss', activityLevel: 'Moderate', macroMode: 'auto', mealSchedule: defaultMealSchedule(), nutritionTargets: targets };
  profile.nutritionTargetInputKey = targetInputKey(profile);
  const menu = { ...plan([32, 33, 32, 33]), mealSchedule: profile.mealSchedule, nutritionProfileKey: nutritionProfileKey(profile) };
  assert.equal(nutritionPlanStatus(menu, profile).staleProfile, false);
  assert.equal(nutritionPlanStatus(menu, { ...profile, name: 'New name', weight: 107 }).staleProfile, false);
  assert.equal(nutritionPlanStatus(menu, { ...profile, mealSchedule: defaultMealSchedule(3) }).staleProfile, true);
  assert.equal(nutritionPlanStatus(menu, { ...profile, allergies: ['Peanuts'] }).staleProfile, true);
  assert.equal(nutritionPlanStatus(menu, { ...profile, goal: 'Muscle Gain' }).staleProfile, true);
  assert.equal(nutritionPlanStatus(menu, { ...profile, nutritionTargets: { ...targets, proteinGrams: 150 } }).staleProfile, true);
  assert.equal(nutritionPlanStatus(menu).needsUpdate, false); // Historical view uses original targets.
  assert.equal(menu.nutritionTargets.proteinGrams, 130);
});

test('rebuilding a five-meal day as three meals retains logged repeated snacks and their original IDs', () => {
  const old = { meals: [{ id: 'am-snack', type: 'snack', label: 'Morning snack', calories: 200 }, { id: 'pm-snack', type: 'snack', label: 'Afternoon snack', calories: 200 }] };
  const tracking = { completedMealIds: ['am-snack', 'pm-snack'], completedExerciseIds: [], totalEstimatedCaloriesConsumed: 400 };
  const result = retainLoggedMeals(old, [], tracking, { totalCalories: 2000, mealSchedule: defaultMealSchedule(3) });
  assert.deepEqual(result.journal.map(meal => meal.id), ['am-snack', 'pm-snack']);
  assert.equal(result.journal[1].label, 'Afternoon snack'); assert.equal(result.tracking.totalEstimatedCaloriesConsumed, 400);
});
