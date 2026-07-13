import { randomUrl, type OAuthSession, type OAuthStore, type Transaction } from './security';

const transactionKey = (state: string) => `transaction:${state}`;
const sessionKey = (id: string) => `session:${id}`;

export class OAuthSessionDurableObject {
  constructor(private readonly state: DurableObjectState) {}

  async putTransaction(transaction: Transaction): Promise<void> {
    await this.state.storage.put(transactionKey(transaction.state), transaction);
    await this.scheduleCleanup(transaction.expiresAt);
  }

  async consumeTransaction(state: string): Promise<Transaction> {
    const key = transactionKey(state);
    const transaction = await this.state.storage.get<Transaction>(key);
    if (!transaction) throw new Error('oauth_invalid_state');
    await this.state.storage.delete(key);
    if (transaction.expiresAt <= Date.now()) throw new Error('oauth_state_expired');
    return transaction;
  }

  async putSession(id: string, session: OAuthSession): Promise<void> {
    await this.state.storage.put(sessionKey(id), session);
    await this.scheduleCleanup(session.expiresAt);
  }

  async getSession(id: string): Promise<OAuthSession | undefined> {
    const key = sessionKey(id);
    const session = await this.state.storage.get<OAuthSession>(key);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) { await this.state.storage.delete(key); return undefined; }
    return session;
  }

  async deleteSession(id: string): Promise<void> { await this.state.storage.delete(sessionKey(id)); }

  async alarm(): Promise<void> {
    const entries = await this.state.storage.list<Transaction | OAuthSession>({ prefix: '' });
    const now = Date.now();
    const expired = [...entries].filter(([, value]) => value.expiresAt <= now).map(([key]) => key);
    if (expired.length) await this.state.storage.delete(expired);
    const remaining = [...entries].filter(([key, value]) => !expired.includes(key) && value.expiresAt > now).map(([, value]) => value.expiresAt);
    if (remaining.length) await this.state.storage.setAlarm(Math.min(...remaining));
  }

  private async scheduleCleanup(expiresAt: number) {
    const current = await this.state.storage.getAlarm();
    if (current === null || expiresAt < current) await this.state.storage.setAlarm(expiresAt);
  }
}

export interface OAuthSessionStub {
  putTransaction(transaction: Transaction): Promise<void>;
  consumeTransaction(state: string): Promise<Transaction>;
  putSession(id: string, session: OAuthSession): Promise<void>;
  getSession(id: string): Promise<OAuthSession | undefined>;
  deleteSession(id: string): Promise<void>;
}

export class DurableObjectOAuthStore implements OAuthStore {
  constructor(private readonly stub: OAuthSessionStub, private readonly now = () => Date.now()) {}
  async createOAuthTransaction(redirectTarget: string, audience: string, verifier: string) {
    const transaction = { state: randomUrl(), codeVerifier: verifier, redirectTarget, audience, createdAt: this.now(), expiresAt: this.now() + 600_000 };
    await this.stub.putTransaction(transaction);
    return transaction;
  }
  async consumeOAuthTransaction(state: string) { return this.stub.consumeTransaction(state); }
  async createSession(audience: string, scopes: string[], encryptedToken: string) {
    const id = randomUrl();
    await this.stub.putSession(id, { audience, scopes, encryptedToken, expiresAt: this.now() + 3_600_000 });
    return id;
  }
  async getSession(id: string, audience: string) {
    const session = await this.stub.getSession(id);
    return session?.audience === audience ? session : undefined;
  }
  async deleteSession(id: string) { await this.stub.deleteSession(id); }
}
