const encoder = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const randomUrl = (length = 48) => b64(crypto.getRandomValues(new Uint8Array(length)));
export async function pkce() {
  const verifier = randomUrl(64);
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return { verifier, challenge: b64(new Uint8Array(digest)), method: 'S256' as const };
}

export type Transaction = { state: string; codeVerifier: string; redirectTarget: string; audience: string; createdAt: number; expiresAt: number };
export type OAuthSession = { expiresAt: number; audience: string; scopes: string[]; encryptedToken: string };
export interface OAuthStore {
  createOAuthTransaction(redirectTarget: string, audience: string, verifier: string): Promise<Transaction>;
  consumeOAuthTransaction(state: string): Promise<Transaction>;
  createSession(audience: string, scopes: string[], encryptedToken: string): Promise<string>;
  getSession(id: string, audience: string): Promise<OAuthSession | undefined>;
  deleteSession(id: string): Promise<void>;
}

export class MemorySessionStore implements OAuthStore {
  private transactions = new Map<string, Transaction>();
  private sessions = new Map<string, OAuthSession>();
  async createOAuthTransaction(redirectTarget: string, audience: string, verifier: string) {
    const state = randomUrl();
    const transaction = { state, codeVerifier: verifier, redirectTarget, audience, createdAt: Date.now(), expiresAt: Date.now() + 600_000 };
    this.transactions.set(state, transaction);
    return transaction;
  }
  async consumeOAuthTransaction(state: string) {
    const transaction = this.transactions.get(state);
    if (!transaction) throw new Error('oauth_invalid_state');
    this.transactions.delete(state);
    if (transaction.expiresAt <= Date.now()) throw new Error('oauth_state_expired');
    return transaction;
  }
  async createSession(audience: string, scopes: string[], encryptedToken: string) {
    const id = randomUrl();
    this.sessions.set(id, { expiresAt: Date.now() + 3_600_000, audience, scopes, encryptedToken });
    return id;
  }
  async getSession(id: string, audience: string) {
    const session = this.sessions.get(id);
    if (!session || session.audience !== audience) return undefined;
    if (session.expiresAt <= Date.now()) { this.sessions.delete(id); return undefined; }
    return session;
  }
  async deleteSession(id: string) { this.sessions.delete(id); }
}

export class ProductionSessionStoreAdapter implements OAuthStore {
  private unavailable(): never { throw new Error('oauth_production_store_not_configured'); }
  async createOAuthTransaction(): Promise<Transaction> { return this.unavailable(); }
  async consumeOAuthTransaction(): Promise<Transaction> { return this.unavailable(); }
  async createSession(): Promise<string> { return this.unavailable(); }
  async getSession(): Promise<OAuthSession | undefined> { return this.unavailable(); }
  async deleteSession(): Promise<void> { return this.unavailable(); }
}

export async function encryptToken(token: string, keyText: string) {
  const key = await crypto.subtle.importKey('raw', new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(keyText))), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(token));
  return `${b64(iv)}.${b64(new Uint8Array(encrypted))}`;
}

export async function signSessionId(id: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `${id}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(id))))}`;
}

export async function verifySessionId(value: string, secret: string) {
  const separator = value.lastIndexOf('.');
  if (separator < 1) return '';
  const id = value.slice(0, separator);
  const expected = await signSessionId(id, secret);
  const actualBytes = encoder.encode(value);
  const expectedBytes = encoder.encode(expected);
  if (actualBytes.length !== expectedBytes.length) return '';
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) difference |= actualBytes[index] ^ expectedBytes[index];
  return difference === 0 ? id : '';
}
