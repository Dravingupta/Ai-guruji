import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStartupProfile, retryStartupRead } from '../src/utils/backendStartup.js';
const options = { totalTimeoutMs: 1000, requestTimeoutMs: 200, retryDelayMs: 1 };
const httpError = (status, data) => Object.assign(new Error('HTTP request failed'), { response: { status, data } });

test('cold-start 503/network failures retry safe reads until the owned profile arrives', async () => {
    let calls = 0;
    const result = await loadStartupProfile(async config => {
        assert.ok(config.signal instanceof AbortSignal);
        assert.ok(config.timeout <= options.requestTimeoutMs);
        if (++calls === 1) throw httpError(503, '<html>Starting</html>');
        if (calls === 2) throw new Error('Network unavailable');
        return { uid: 'owner', name: 'Sample' };
    }, 'owner', options);
    assert.equal(result.uid, 'owner');
    assert.equal(calls, 3);
});

test('only an explicit missing-profile response permits onboarding', async () => {
    let calls = 0;
    assert.equal(await loadStartupProfile(async () => { calls++; throw httpError(404, { error: 'Profile not found' }); }, 'owner', options), null);
    assert.equal(calls, 1);
    for (const [status, data] of [[404, '<html>Not found</html>'], [401, { error: 'Unauthorized' }], [403, { error: 'Forbidden' }]]) {
        calls = 0;
        await assert.rejects(loadStartupProfile(async () => { calls++; throw httpError(status, data); }, 'owner', options));
        assert.equal(calls, 1);
    }
});

test('HTML startup pages and a different account profile are never accepted as success', async () => {
    let calls = 0;
    const responses = ['<html>Starting</html>', { uid: 'someone-else' }, { uid: 'owner' }];
    const profile = await loadStartupProfile(async () => responses[calls++], 'owner', options);
    assert.equal(profile.uid, 'owner');
    assert.equal(calls, 3);
});

test('a hung read is cancelled and the overall retry window is bounded', async () => {
    const signals = [];
    await assert.rejects(retryStartupRead(({ signal }) => {
        signals.push(signal);
        return new Promise(() => {});
    }, { totalTimeoutMs: 80, requestTimeoutMs: 20, retryDelayMs: 5 }), { name: 'TimeoutError' });
    assert.ok(signals.length > 0);
    assert.ok(signals.every(signal => signal.aborted));
    const count = signals.length;
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(signals.length, count);
});

test('sign-out/unmount aborts an in-flight read even when its transport ignores cancellation', async () => {
    const controller = new AbortController();
    let finish, requestSignal;
    const pending = loadStartupProfile(({ signal }) => {
        requestSignal = signal;
        queueMicrotask(() => controller.abort());
        return new Promise(resolve => { finish = resolve; });
    }, 'owner', { ...options, signal: controller.signal });
    await assert.rejects(pending, { name: 'AbortError' });
    assert.ok(requestSignal.aborted);
    finish({ uid: 'owner' });
});

test('cancelling retry backoff or an already-aborted session starts no further reads', async () => {
    const controller = new AbortController();
    let calls = 0;
    const pending = retryStartupRead(async () => {
        calls++;
        setTimeout(() => controller.abort(), 5);
        throw httpError(503, {});
    }, { ...options, signal: controller.signal, retryDelayMs: 100 });
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(calls, 1);
    await assert.rejects(retryStartupRead(async () => { calls++; }, { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(calls, 1);
});
