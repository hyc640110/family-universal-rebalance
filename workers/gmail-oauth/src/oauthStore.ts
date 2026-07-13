import { randomUrl, type OAuthSession, type OAuthStore, type Transaction } from './security';

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
