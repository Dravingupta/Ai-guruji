import test from 'node:test';
import assert from 'node:assert/strict';
import { createHealthHandler } from '../src/controllers/healthController.js';

test('public health distinguishes startup from readiness without cached or personal data', () => {
    for (const ready of [false, true]) {
        const response = { headers: {}, set(name, value) { this.headers[name] = value; return this; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
        createHealthHandler(() => ready)({}, response);
        assert.equal(response.code, ready ? 200 : 503);
        assert.equal(response.headers['Cache-Control'], 'no-store');
        assert.deepEqual(response.data, { service: 'ai-guruji-api', status: ready ? 'ready' : 'starting' });
    }
});
