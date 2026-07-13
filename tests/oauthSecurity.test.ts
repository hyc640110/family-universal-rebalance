import assert from 'node:assert/strict';
import test from 'node:test';
import { assertNoOAuthSecrets, canonicalPersistenceKey, normalizeGmailOAuth, scanSensitivePersistenceKeys } from '../src/lib/gmailOAuth';
import { cookieName, createOAuthWorker, safeRedirect, type Env } from '../workers/gmail-oauth/src/oauthWorker';
import { DurableObjectOAuthStore, type OAuthSessionStub } from '../workers/gmail-oauth/src/oauthStore';
import { encryptToken, MemorySessionStore, pkce, ProductionSessionStoreAdapter, signSessionId, verifySessionId, type OAuthSession, type Transaction } from '../workers/gmail-oauth/src/security';

class PersistentStub implements OAuthSessionStub {
  transactions = new Map<string, Transaction>();
  sessions = new Map<string, OAuthSession>();
  constructor(private readonly now = () => Date.now()) {}
  async putTransaction(transaction: Transaction) { this.transactions.set(transaction.state, structuredClone(transaction)); }
  async consumeTransaction(state: string) {
    const transaction = this.transactions.get(state);
    if (!transaction) throw new Error('oauth_invalid_state');
    this.transactions.delete(state);
    if (transaction.expiresAt <= this.now()) throw new Error('oauth_state_expired');
    return structuredClone(transaction);
  }
  async putSession(id: string, session: OAuthSession) { this.sessions.set(id, structuredClone(session)); }
  async getSession(id: string) {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (session.expiresAt <= this.now()) { this.sessions.delete(id); return undefined; }
    return structuredClone(session);
  }
  async deleteSession(id: string) { this.sessions.delete(id); }
}

const env = (overrides: Partial<Env> = {}): Env => ({
  GOOGLE_CLIENT_ID: 'replace-with-google-client-id', GOOGLE_CLIENT_SECRET: 'replace-with-google-client-secret',
  OAUTH_SESSION_SECRET: 'replace-with-random-secret', TOKEN_ENCRYPTION_KEY: 'replace-with-32-byte-key',
  ENVIRONMENT: 'preview', ALLOWED_ORIGINS: 'https://preview.example', ALLOWED_REDIRECTS: 'https://preview.example/app/', ...overrides
});

test('PKCE uses S256 with secure verifier properties', async () => {
  const first = await pkce(), second = await pkce();
  assert.equal(first.method, 'S256'); assert.match(first.verifier, /^[A-Za-z0-9_-]+$/);
  assert.ok(first.verifier.length >= 43 && first.verifier.length <= 128);
  assert.notEqual(first.verifier, second.verifier); assert.notEqual(first.challenge, second.challenge);
});

test('persistent store creates, reads, revokes, and survives adapter recreation', async () => {
  const stub = new PersistentStub();
  const firstInstance = new DurableObjectOAuthStore(stub);
  const id = await firstInstance.createSession('preview', ['scope'], 'encrypted.payload');
  const secondInstance = new DurableObjectOAuthStore(stub);
  assert.equal((await secondInstance.getSession(id, 'preview'))?.encryptedToken, 'encrypted.payload');
  assert.equal(await secondInstance.getSession(id, 'production'), undefined);
  await secondInstance.deleteSession(id);
  assert.equal(await firstInstance.getSession(id, 'preview'), undefined);
});

test('transaction is consume-once and expired transaction is rejected', async () => {
  let now = 1_000;
  const stub = new PersistentStub(() => now);
  const store = new DurableObjectOAuthStore(stub, () => now);
  const transaction = await store.createOAuthTransaction('https://preview.example/app/', 'https://preview.example', 'verifier');
  assert.equal((await store.consumeOAuthTransaction(transaction.state)).codeVerifier, 'verifier');
  await assert.rejects(store.consumeOAuthTransaction(transaction.state), /invalid_state/);
  const expired = await store.createOAuthTransaction('https://preview.example/app/', 'https://preview.example', 'expired-verifier');
  now += 600_001;
  await assert.rejects(store.consumeOAuthTransaction(expired.state), /state_expired/);
});

test('expired sessions are rejected', async () => {
  let now = 1_000;
  const stub = new PersistentStub(() => now);
  const store = new DurableObjectOAuthStore(stub, () => now);
  const id = await store.createSession('preview', ['scope'], 'encrypted.payload');
  now += 3_600_001;
  assert.equal(await store.getSession(id, 'preview'), undefined);
});

test('only AES-GCM ciphertext is persisted', async () => {
  const stub = new PersistentStub(); const store = new DurableObjectOAuthStore(stub);
  const encrypted = await encryptToken('fake-access-and-refresh-token', 'test-encryption-key');
  const id = await store.createSession('preview', ['scope'], encrypted);
  const persisted = stub.sessions.get(id);
  assert.ok(persisted); assert.equal(JSON.stringify(persisted).includes('fake-access-and-refresh-token'), false);
  assert.match(persisted.encryptedToken, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
});

test('preview and production persistent namespaces and cookies are isolated', async () => {
  const preview = new DurableObjectOAuthStore(new PersistentStub());
  const production = new DurableObjectOAuthStore(new PersistentStub());
  const id = await preview.createSession('https://app.example', ['scope'], 'encrypted.payload');
  assert.ok(await preview.getSession(id, 'https://app.example'));
  assert.equal(await production.getSession(id, 'https://app.example'), undefined);
  assert.notEqual(cookieName('preview'), cookieName('production'));
});

test('session cookies are signed and reject tampering', async () => {
  const signed = await signSessionId('session-id', 'session-secret');
  assert.equal(await verifySessionId(signed, 'session-secret'), 'session-id');
  assert.equal(await verifySessionId(`${signed}x`, 'session-secret'), '');
  assert.equal(await verifySessionId(signed, 'other-secret'), '');
});

test('redirect allowlist falls back safely', () => {
  const config = env();
  assert.equal(safeRedirect('https://preview.example/app/', config), 'https://preview.example/app/');
  assert.equal(safeRedirect('https://evil.example/', config), 'https://preview.example/app/');
});

test('routes enforce origin, CSRF, and safe failure when secrets are unset', async () => {
  const store = new MemorySessionStore(); const worker = createOAuthWorker(() => store); const config = env();
  const blocked = await worker.fetch(new Request('https://oauth.example/oauth/google/status'), config); assert.equal(blocked.status, 403);
  const status = await worker.fetch(new Request('https://oauth.example/oauth/google/status', { headers: { Origin: 'https://preview.example' } }), config);
  assert.equal(status.status, 200); const body = await status.json() as { status: string; grantedScopes: string[] };
  assert.equal(body.status, 'disconnected'); assert.deepEqual(body.grantedScopes, []);
  const csrf = await worker.fetch(new Request('https://oauth.example/oauth/google/disconnect', { method: 'POST', headers: { Origin: 'https://preview.example' } }), config); assert.equal(csrf.status, 403);
  const start = await worker.fetch(new Request('https://oauth.example/oauth/google/start', { headers: { Origin: 'https://preview.example' } }), config); assert.equal(start.status, 503);
});

test('top-level OAuth start accepts only an explicit allowlisted frontend redirect', async () => {
  const store = new MemorySessionStore(); const worker = createOAuthWorker(() => store);
  const configuredEnv = env({ GOOGLE_CLIENT_ID: 'test-client-id', GOOGLE_CLIENT_SECRET: 'test-client-secret', OAUTH_SESSION_SECRET: 'test-session-secret', TOKEN_ENCRYPTION_KEY: 'test-encryption-key' });
  const allowed = await worker.fetch(new Request('https://oauth.example/oauth/google/start?redirect=https%3A%2F%2Fpreview.example%2Fapp%2F'), configuredEnv);
  assert.equal(allowed.status, 302);
  assert.match(allowed.headers.get('location') || '', /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  const blocked = await worker.fetch(new Request('https://oauth.example/oauth/google/start?redirect=https%3A%2F%2Fevil.example%2F'), configuredEnv);
  assert.equal(blocked.status, 403);
});

test('deployed worker never falls back to MemorySessionStore when binding is absent', async () => {
  const worker = createOAuthWorker();
  const response = await worker.fetch(new Request('https://oauth.example/oauth/google/status', { headers: { Origin: 'https://preview.example' } }), env());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'oauth_store_not_configured' });
  await assert.rejects(new ProductionSessionStoreAdapter().createSession('preview', [], 'encrypted'), /not_configured/);
});

test('canonical persistence keys reject every sensitive naming variation', () => {
  const forbidden = ['accessToken','access_token','access-token','refreshToken','refresh_token','refresh-token','authorizationCode','authorization_code','authorization-code','oauthCode','oauth_code','clientSecret','client_secret','client-secret','googlePassword','google_password','password','codeVerifier','code_verifier','code-verifier','CodeVerifier','CODE_VERIFIER','pkceVerifier','pkce_verifier','pkce-verifier','PkceVerifier','PKCE_VERIFIER','oauthState','oauth_state','oauth-state','OAuthState','OAUTH_STATE','oauthTransactionState','oauth_transaction_state','oauth-transaction-state','OAuthTransactionState','encryptedToken','encrypted_token','encrypted-token','EncryptedToken','ENCRYPTED_TOKEN','encryptedRefreshToken','encrypted_refresh_token','encrypted-refresh-token','EncryptedRefreshToken','tokenCiphertext','token_ciphertext','token-ciphertext','TokenCiphertext'];
  for (const key of forbidden) assert.throws(() => assertNoOAuthSecrets({ [key]: 'redacted-test-value' }), /不可持久化/, key);
  assert.equal(canonicalPersistenceKey('Encrypted_Refresh-Token'), 'encryptedrefreshtoken');
});

test('persistence scanner recursively rejects root arrays and mixed nested structures', () => {
  const unsafe = [{ oauth: { codeVerifier: 'x' } }, { sessions: [{ oauthState: 'x' }] }, { security: { tokenStore: { encryptedToken: 'x' } } }, [{ profile: { pkce_verifier: 'x' } }], { items: [[{ encrypted_refresh_token: 'x' }]] }];
  for (const payload of unsafe) assert.throws(() => assertNoOAuthSecrets(payload), /不可持久化/);
  assert.equal(scanSensitivePersistenceKeys({ safe: [{ nested: { value: 1 } }] }), undefined);
});

test('exact denylist allows legitimate token and state metadata names', () => {
  const safe = { tokenCount: 3, token_count: 3, designToken: 'surface', design_token: 'surface', paginationToken: 'page', pagination_token: 'page', colorToken: 'blue', color_token: 'blue', oauthStatus: 'disconnected', oauth_status: 'disconnected', stateVersion: 1, state_version: 1, encryptedMetadata: 'display-only', encrypted_metadata: 'display-only' };
  assert.doesNotThrow(() => assertNoOAuthSecrets(safe));
});

test('backup metadata always disconnects instead of restoring a session', () => {
  assert.deepEqual(normalizeGmailOAuth({ status: 'connected', access_token: 'not-allowed' }), { status: 'disconnected', grantedScopes: [], lastCheckedAt: undefined });
});
