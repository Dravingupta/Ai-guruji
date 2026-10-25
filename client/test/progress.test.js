import test from 'node:test';
import assert from 'node:assert/strict';
import { activitySummary, activityStreak, checkInDue, dateForSection, weightSummary } from '../src/utils/progressData.js';

test('weekly weigh-ins show real change while reused/skipped values never fabricate trend points', () => {
  const entries = [{ date: '2026-10-12', status: 'measured', weightKg: 78 }, { date: '2026-10-19', status: 'measured', weightKg: 77.2 }, { date: '2026-10-20', status: 'reused', weightKg: 50 }, { date: '2026-10-25', status: 'skipped', weightKg: null }];
  const summary = weightSummary(entries, '2026-10-25', 14);
  assert.equal(summary.actual.length, 2); assert.equal(summary.change, -0.8);
  assert.equal(weightSummary(entries, '2026-10-25', 7).change, null);
  assert.equal(weightSummary([], '2026-10-25', 14).latest, null);
});

test('overview, nutrition, coach, and progress always use today regardless of browsed training date', () => {
  for (const section of ['overview', 'meals', 'coach', 'progress', 'profile']) assert.equal(dateForSection(section, '2026-10-26', '2026-10-25'), '2026-10-25');
  assert.equal(dateForSection('workout', '2026-10-26', '2026-10-25'), '2026-10-26');
});

test('frequency respects weekly/occasional preferences and an explicit skip suppresses today’s prompt', () => {
  const entries = [{ date: '2026-10-20', status: 'measured', weightKg: 77 }];
  assert.equal(checkInDue(entries, 'weekly', '2026-10-25'), false);
  assert.equal(checkInDue(entries, 'weekly', '2026-10-27'), true);
  assert.equal(checkInDue(entries, 'daily', '2026-10-25'), true);
  assert.equal(checkInDue(entries, 'when_ready', '2026-10-25'), false);
  assert.equal(checkInDue(entries, 'off', '2026-10-25'), false);
  assert.equal(checkInDue([{ date: '2026-10-24', status: 'skipped' }], 'weekly', '2026-10-25'), false);
  assert.equal(checkInDue([...entries, { date: '2026-10-25', status: 'skipped' }], 'daily', '2026-10-25'), false);
});

test('generated plans alone do not count as active days and another account’s logs are excluded', () => {
  const saved = { aiCoachDiet_owner_2026_ignored: '{}', aiCoachDiet_owner_2026: '{}', aiCoachTracking_owner_2026: '{}', 'aiCoachDiet_owner_2026-10-24': '{}', 'aiCoachTracking_owner_2026-10-25': JSON.stringify({ completedMealIds: ['meal'], completedExerciseIds: [] }), 'aiCoachTracking_other_2026-10-24': JSON.stringify({ completedMealIds: ['a', 'b'] }) };
  const storage = { getItem: key => saved[key] || null };
  const result = activitySummary('owner', '2026-10-25', 2, storage);
  assert.equal(result.activeDays, 1); assert.equal(result.mealsLogged, 1); assert.equal(result.movementDays, 0);
});


test('an empty current day and a skipped weight entry do not erase yesterday’s activity streak', () => {
  const records = { 'aiCoachTracking_owner_2026-10-25': JSON.stringify({ completedMealIds: [], completedExerciseIds: [] }), 'aiCoachTracking_owner_2026-10-24': JSON.stringify({ completedMealIds: ['meal'] }), 'aiCoachTracking_owner_2026-10-23': JSON.stringify({ completedExerciseIds: ['exercise'] }) };
  assert.equal(activityStreak('owner', '2026-10-25', { getItem: key => records[key] || null }), 2);
});
