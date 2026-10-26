import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { getApp, getApps, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import initializeFirebase from '../src/config/firebase.js';
import { createTokenVerifier, verifyToken } from '../src/middlewares/authMiddleware.js';

const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('token verification uses verified identity rather than request-supplied ownership', async () => {
    const calls = [], req = { headers: { authorization: 'Bearer test-token' }, body: { uid: 'forged' } }, res = response();
    let continued = false;
    await createTokenVerifier(async token => { calls.push(token); return { uid: 'verified-owner', email: 'test@example.com' }; })(req, res, () => { continued = true; });
    assert.deepEqual(calls, ['test-token']);
    assert.deepEqual(req.user, { uid: 'verified-owner', email: 'test@example.com' });
    assert.equal(continued, true);
});

test('missing and rejected tokens cannot reach protected handlers', async () => {
    let checked = 0, continued = false;
    const handler = createTokenVerifier(async () => { checked++; throw new Error('Invalid test token'); });
    for (const headers of [{}, { authorization: 'Basic test' }, { authorization: 'Bearer rejected-token' }]) {
        const req = { headers }, res = response();
        await handler(req, res, () => { continued = true; });
        assert.equal(res.code, 401);
        assert.equal(req.user, undefined);
    }
    assert.equal(checked, 1);
    assert.equal(continued, false);
});

test('Firebase modular SDK accepts both existing credential formats and rejects malformed tokens locally', async t => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
    const keys = ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
    const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    t.after(async () => {
        await Promise.all(getApps().map(app => deleteApp(app)));
        for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    });
    for (const format of ['fields', 'json']) {
        process.env.FIREBASE_PROJECT_ID = 'synthetic-project';
        process.env.FIREBASE_CLIENT_EMAIL = 'test@synthetic-project.iam.gserviceaccount.com';
        process.env.FIREBASE_PRIVATE_KEY = privateKey.replace(/\n/g, '\\n');
        delete process.env.FIREBASE_SERVICE_ACCOUNT;
        if (format === 'json') process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'synthetic-project', client_email: process.env.FIREBASE_CLIENT_EMAIL, private_key: privateKey });
        initializeFirebase();
        assert.equal(getApps().length, 1);
        assert.equal(getAuth().app, getApp());
        const req = { headers: { authorization: 'Bearer malformed-test-token' } }, res = response();
        await verifyToken(req, res, () => assert.fail('Malformed token reached a protected handler'));
        assert.equal(res.code, 401);
        await deleteApp(getApp());
    }
});
