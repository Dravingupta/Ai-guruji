import test from 'node:test';
import assert from 'node:assert/strict';
import WeightCheckIn from '../src/models/WeightCheckIn.js';
import User from '../src/models/User.js';
import { validateCheckIn } from '../src/services/progressValidation.js';
import { getProgress, saveCheckIn, saveProgressPreferences } from '../src/controllers/progressController.js';
import { withLatestWeight } from '../src/services/profileContextService.js';
import { createOrUpdateProfile } from '../src/controllers/userController.js';
const res = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });
const query = result => ({ sort: () => ({ lean: async () => result }) });
const request = body => ({ user: { uid: 'owner' }, params: { date: '2026-01-10' }, body });

test('weight validation accepts historical measurements and rejects invalid or future dates/numbers', () => {
    assert.equal(validateCheckIn('2026-01-10', { status: 'measured', weightKg: 74.56 }, '2026-01-11').weightKg, 74.6);
    for (const date of ['2026-02-30', '2026-1-10', '2026-01-12']) assert.throws(() => validateCheckIn(date, { status: 'skipped' }, '2026-01-11'));
    for (const weightKg of [null, '', '75', 0, 19, 501, Infinity]) assert.throws(() => validateCheckIn('2026-01-10', { status: 'measured', weightKg }, '2026-01-11'));
    const skipped = validateCheckIn('2026-01-10', { status: 'skipped', weightKg: 75, sourceDate: '2026-01-01' }, '2026-01-11');
    assert.equal(skipped.weightKg, null); assert.equal(skipped.sourceDate, null);
});

test('check-in overwrite is owned by verified UID and skipping removes the previous value', async t => {
    t.mock.method(User, 'findOne', async () => ({ uid: 'owner' }));
    const write = t.mock.method(WeightCheckIn, 'findOneAndUpdate', async (filter, update) => update.$set);
    const response = res();
    await saveCheckIn(request({ status: 'skipped', userId: 'someone-else', weightKg: 80, sourceDate: '2026-01-01' }), response);
    assert.equal(response.code, 200);
    assert.deepEqual(write.mock.calls[0].arguments[0], { userId: 'owner', date: '2026-01-10' });
    assert.equal(response.data.userId, 'owner'); assert.equal(response.data.weightKg, null); assert.equal(response.data.sourceDate, null);
    assert.equal(write.mock.calls[0].arguments[2].upsert, true);
});

test('reuse resolves the last actual earlier measurement on the server, ignoring supplied values', async t => {
    t.mock.method(User, 'findOne', async () => ({ uid: 'owner' }));
    const prior = t.mock.method(WeightCheckIn, 'findOne', () => query({ date: '2026-01-03', weightKg: 74.5 }));
    t.mock.method(WeightCheckIn, 'findOneAndUpdate', async (filter, update) => update.$set);
    const response = res(); await saveCheckIn(request({ status: 'reused', weightKg: 999, sourceDate: '2025-01-01' }), response);
    assert.equal(response.data.weightKg, 74.5); assert.equal(response.data.sourceDate, '2026-01-03');
    assert.deepEqual(prior.mock.calls[0].arguments[0], { userId: 'owner', status: 'measured', date: { $lt: '2026-01-10' } });
});

test('reuse without a previous measurement is a recoverable error with no write', async t => {
    t.mock.method(User, 'findOne', async () => ({ uid: 'owner' }));
    t.mock.method(WeightCheckIn, 'findOne', () => query(null));
    const write = t.mock.method(WeightCheckIn, 'findOneAndUpdate', async () => { throw new Error('must not write'); });
    const response = res(); await saveCheckIn(request({ status: 'reused' }), response);
    assert.equal(response.code, 400); assert.equal(write.mock.calls.length, 0);
});

test('progress reads and preference writes stay scoped to the authenticated account', async t => {
    t.mock.method(User, 'findOne', async () => ({ weighInFrequency: 'weekly' }));
    const find = t.mock.method(WeightCheckIn, 'find', () => query([]));
    const response = res(); await getProgress(request({ userId: 'other' }), response);
    assert.deepEqual(find.mock.calls[0].arguments[0], { userId: 'owner' });
    assert.equal(response.data.frequency, 'weekly');
    const update = t.mock.method(User, 'findOneAndUpdate', async () => ({ weighInFrequency: 'off' }));
    await saveProgressPreferences(request({ frequency: 'off', weight: 1, uid: 'other' }), res());
    assert.deepEqual(update.mock.calls[0].arguments.slice(0, 2), [{ uid: 'owner' }, { $set: { weighInFrequency: 'off' } }]);
    const missing = res(); await saveProgressPreferences({ user: { uid: 'owner' } }, missing);
    assert.equal(missing.code, 400); assert.equal(update.mock.calls.length, 1);
});

test('future personalization uses measured weight without overwriting the baseline profile', async t => {
    const find = t.mock.method(WeightCheckIn, 'findOne', () => query({ date: '2026-01-03', weightKg: 74.5 }));
    const baseline = { weight: 78, goal: 'General Fitness' };
    const context = await withLatestWeight(baseline, 'owner');
    assert.equal(context.weight, 74.5); assert.equal(context.weightRecordedOn, '2026-01-03'); assert.equal(baseline.weight, 78);
    assert.equal(find.mock.calls[0].arguments[0].status, 'measured');
    assert.equal(find.mock.calls[0].arguments[0].userId, 'owner');
});


test('a stale profile edit cannot reset a check-in frequency preference', async t => {
    t.mock.method(User, 'findOne', async () => ({ uid: 'owner', name: 'Old name' }));
    const update = t.mock.method(User, 'findOneAndUpdate', async (query, data) => data);
    await createOrUpdateProfile(request({ name: 'Updated name', weighInFrequency: 'daily' }), res());
    assert.equal(update.mock.calls[0].arguments[1].name, 'Updated name');
    assert.ok(!Object.hasOwn(update.mock.calls[0].arguments[1], 'weighInFrequency'));
});
