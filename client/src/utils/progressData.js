export const dayKey = () => new Date().toISOString().slice(0, 10);
export const addDays = (date, amount) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); };
export const displayDate = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const daysInRange = (end, count) => Array.from({ length: count }, (_, index) => addDays(end, index - count + 1));
export function readSaved(storage, key, fallback = null) {
  try { return JSON.parse(storage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
export function readDay(uid, date, storage = localStorage) {
  return {
    date, diet: readSaved(storage, `aiCoachDiet_${uid}_${date}`), workout: readSaved(storage, `aiCoachWorkout_${uid}_${date}`),
    tracking: readSaved(storage, `aiCoachTracking_${uid}_${date}`),
    meals: readSaved(storage, `aiCoachManualMeals_${uid}_${date}`, []), activities: readSaved(storage, `aiCoachManualWorkouts_${uid}_${date}`, [])
  };
}
export function weightSummary(entries, end, count) {
  const start = addDays(end, 1 - count);
  const actual = entries.filter(entry => entry.status === 'measured' && typeof entry.weightKg === 'number' && Number.isFinite(entry.weightKg) && entry.date >= start && entry.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  return { actual, first: actual[0] || null, latest: actual.at(-1) || null, change: actual.length > 1 ? Math.round((actual.at(-1).weightKg - actual[0].weightKg) * 10) / 10 : null };
}
export function activitySummary(uid, end, count, storage = localStorage) {
  const days = daysInRange(end, count).map(date => readDay(uid, date, storage));
  return {
    days, activeDays: days.filter(day => day.tracking?.completedMealIds?.length || day.tracking?.completedExerciseIds?.length).length,
    mealsLogged: days.reduce((sum, day) => sum + (day.tracking?.completedMealIds?.length || 0), 0),
    movementDays: days.filter(day => day.tracking?.completedExerciseIds?.length).length,
    exercisesLogged: days.reduce((sum, day) => sum + (day.tracking?.completedExerciseIds?.length || 0), 0)
  };
}
export function checkInDue(entries, frequency, today) {
  if (frequency === 'off' || frequency === 'when_ready' || entries.some(entry => entry.date === today)) return false;
  if (frequency === 'daily') return true;
  // Weekly prompts follow the last explicit check-in choice, even a skip.
  // This changes reminder timing, never the measured-weight trend.
  const latest = entries.filter(entry => entry.date <= today).sort((a, b) => b.date.localeCompare(a.date))[0];
  return !latest || latest.date <= addDays(today, -7);
}

export const dateForSection = (section, trainingDate, today) => section === 'workout' && trainingDate >= today ? trainingDate : today;

export function activityStreak(uid, today, storage = localStorage) {
  let streak = 0;
  for (let offset = 0; offset < 30; offset++) {
    const tracking = readDay(uid, addDays(today, -offset), storage).tracking;
    const active = tracking?.completedMealIds?.length || tracking?.completedExerciseIds?.length;
    if (active) streak++;
    else if (offset > 0) break;
  }
  return streak;
}
