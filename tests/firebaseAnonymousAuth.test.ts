import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFirebaseAnonymousSessionSingleFlight,
  ensureFirebaseAnonymousSession,
  isSessionFresh,
  parseRefreshResponse,
  parseSignUpResponse,
  readPersistedFirebaseAuthSession,
  writePersistedFirebaseAuthSession,
  FIREBASE_AUTH_EXPIRY_SAFETY_MARGIN_MS,
  type FirebaseAuthSession
} from '../src/lib/firebaseAnonymousAuth';

const NOW = 1_800_000_000_000;

test('parseSignUpResponse maps Identity Toolkit camelCase fields and computes an absolute expiry', () => {
  const session = parseSignUpResponse({ localId: 'uid-1', idToken: 'id-token-1', refreshToken: 'refresh-token-1', expiresIn: '3600' }, NOW);
  assert.deepEqual(session, { uid: 'uid-1', idToken: 'id-token-1', refreshToken: 'refresh-token-1', expiresAt: NOW + 3_600_000 });
});

test('parseRefreshResponse maps Secure Token API snake_case fields', () => {
  const session = parseRefreshResponse({ user_id: 'uid-1', id_token: 'id-token-2', refresh_token: 'refresh-token-2', expires_in: '3600' }, NOW);
  assert.deepEqual(session, { uid: 'uid-1', idToken: 'id-token-2', refreshToken: 'refresh-token-2', expiresAt: NOW + 3_600_000 });
});

test('parseSignUpResponse and parseRefreshResponse reject malformed or incomplete responses', () => {
  assert.throws(() => parseSignUpResponse({}, NOW), /格式不正確/);
  assert.throws(() => parseSignUpResponse({ localId: 'uid-1', idToken: '', refreshToken: 'r', expiresIn: '3600' }, NOW), /格式不正確/);
  assert.throws(() => parseSignUpResponse({ localId: 'uid-1', idToken: 'i', refreshToken: 'r', expiresIn: 'not-a-number' }, NOW), /格式不正確/);
  assert.throws(() => parseRefreshResponse(null, NOW), /格式不正確/);
});

function session(overrides: Partial<FirebaseAuthSession> = {}): FirebaseAuthSession {
  return { uid: 'uid-1', idToken: 'id-token', refreshToken: 'refresh-token', expiresAt: NOW + 3_600_000, ...overrides };
}

test('isSessionFresh applies the safety margin instead of the raw expiry instant', () => {
  assert.equal(isSessionFresh(session({ expiresAt: NOW + FIREBASE_AUTH_EXPIRY_SAFETY_MARGIN_MS + 1 }), NOW), true);
  assert.equal(isSessionFresh(session({ expiresAt: NOW + FIREBASE_AUTH_EXPIRY_SAFETY_MARGIN_MS - 1 }), NOW), false);
  assert.equal(isSessionFresh(session({ expiresAt: NOW - 1 }), NOW), false);
});

test('ensureFirebaseAnonymousSession reuses a fresh persisted session without any network call', async () => {
  const persisted = session();
  let signUpCalls = 0;
  let refreshCalls = 0;
  const result = await ensureFirebaseAnonymousSession({
    apiKey: 'key', now: NOW, persisted,
    signUp: async () => { signUpCalls += 1; throw new Error('should not be called'); },
    refresh: async () => { refreshCalls += 1; throw new Error('should not be called'); }
  });
  assert.deepEqual(result, persisted);
  assert.equal(signUpCalls, 0);
  assert.equal(refreshCalls, 0);
});

test('ensureFirebaseAnonymousSession refreshes a stale persisted session and keeps the same uid', async () => {
  const persisted = session({ expiresAt: NOW - 1 });
  let signUpCalls = 0;
  const result = await ensureFirebaseAnonymousSession({
    apiKey: 'key', now: NOW, persisted,
    signUp: async () => { signUpCalls += 1; throw new Error('should not be called'); },
    refresh: async (refreshToken) => {
      assert.equal(refreshToken, persisted.refreshToken);
      return { user_id: persisted.uid, id_token: 'new-id-token', refresh_token: 'new-refresh-token', expires_in: '3600' };
    }
  });
  assert.equal(result.uid, persisted.uid);
  assert.equal(result.idToken, 'new-id-token');
  assert.equal(signUpCalls, 0);
});

test('ensureFirebaseAnonymousSession falls back to a fresh sign-up when refresh fails (e.g. revoked token)', async () => {
  const persisted = session({ expiresAt: NOW - 1 });
  const result = await ensureFirebaseAnonymousSession({
    apiKey: 'key', now: NOW, persisted,
    signUp: async () => ({ localId: 'brand-new-uid', idToken: 'fresh-id-token', refreshToken: 'fresh-refresh-token', expiresIn: '3600' }),
    refresh: async () => { throw new Error('refresh token revoked'); }
  });
  assert.equal(result.uid, 'brand-new-uid');
});

test('ensureFirebaseAnonymousSession signs up a brand-new anonymous user when there is no persisted session', async () => {
  let refreshCalls = 0;
  const result = await ensureFirebaseAnonymousSession({
    apiKey: 'key', now: NOW, persisted: null,
    signUp: async () => ({ localId: 'new-user-uid', idToken: 'id-token', refreshToken: 'refresh-token', expiresIn: '3600' }),
    refresh: async () => { refreshCalls += 1; throw new Error('should not be called'); }
  });
  assert.equal(result.uid, 'new-user-uid');
  assert.equal(refreshCalls, 0);
});

test('ensureFirebaseAnonymousSession rejects when apiKey is missing, before attempting any network call', async () => {
  await assert.rejects(
    ensureFirebaseAnonymousSession({ apiKey: '', now: NOW, persisted: null, signUp: async () => ({}), refresh: async () => ({}) }),
    /API Key/
  );
});

test('single-flight shares one in-flight manual Auth operation and permits a later operation after it settles', async () => {
  let calls = 0;
  const singleFlight = createFirebaseAnonymousSessionSingleFlight(() => {
    calls += 1;
    return Promise.resolve(session({ uid: `uid-${calls}` }));
  });

  const first = singleFlight();
  const second = singleFlight();
  assert.equal(calls, 1);
  assert.equal(first, second);
  await first;

  const third = singleFlight();
  assert.equal(calls, 2);
  assert.notEqual(third, first);
  await third;
});

test('persisted session storage round-trips through the given storage key and rejects malformed stored values', () => {
  const store = new Map<string, string>();
  const fakeStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); }
  };
  (globalThis as { localStorage?: unknown }).localStorage = fakeStorage;

  assert.equal(readPersistedFirebaseAuthSession('firebase-auth-key'), null);
  const value = session();
  writePersistedFirebaseAuthSession('firebase-auth-key', value);
  assert.deepEqual(readPersistedFirebaseAuthSession('firebase-auth-key'), value);

  store.set('firebase-auth-key', JSON.stringify({ uid: 'uid-1' }));
  assert.equal(readPersistedFirebaseAuthSession('firebase-auth-key'), null);

  store.set('firebase-auth-key', 'not-json');
  assert.equal(readPersistedFirebaseAuthSession('firebase-auth-key'), null);
});
