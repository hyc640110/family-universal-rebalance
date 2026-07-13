import { DurableObject } from 'cloudflare:workers';
import type { OAuthSession, Transaction } from './security';

const transactionKey = (state: string) => `transaction:${state}`;
const sessionKey = (id: string) => `session:${id}`;

export class OAuthSessionDurableObject extends DurableObject {
  async putTransaction(transaction: Transaction): Promise<void> {
    await this.ctx.storage.put(transactionKey(transaction.state), transaction);
    await this.scheduleCleanup(transaction.expiresAt);
  }

  async consumeTransaction(state: string): Promise<Transaction> {
    const key = transactionKey(state);
    const transaction = await this.ctx.storage.get<Transaction>(key);
    if (!transaction) throw new Error('oauth_invalid_state');
    await this.ctx.storage.delete(key);
    if (transaction.expiresAt <= Date.now()) throw new Error('oauth_state_expired');
    return transaction;
  }

  async putSession(id: string, session: OAuthSession): Promise<void> {
    await this.ctx.storage.put(sessionKey(id), session);
    await this.scheduleCleanup(session.expiresAt);
  }

  async getSession(id: string): Promise<OAuthSession | undefined> {
    const key = sessionKey(id);
    const session = await this.ctx.storage.get<OAuthSession>(key);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) { await this.ctx.storage.delete(key); return undefined; }
    return session;
  }

  async deleteSession(id: string): Promise<void> { await this.ctx.storage.delete(sessionKey(id)); }

  async alarm(): Promise<void> {
    const entries = await this.ctx.storage.list<Transaction | OAuthSession>({ prefix: '' });
    const now = Date.now();
    const expired = [...entries].filter(([, value]) => value.expiresAt <= now).map(([key]) => key);
    if (expired.length) await this.ctx.storage.delete(expired);
    const remaining = [...entries].filter(([key, value]) => !expired.includes(key) && value.expiresAt > now).map(([, value]) => value.expiresAt);
    if (remaining.length) await this.ctx.storage.setAlarm(Math.min(...remaining));
  }

  private async scheduleCleanup(expiresAt: number) {
    const current = await this.ctx.storage.getAlarm();
    if (current === null || expiresAt < current) await this.ctx.storage.setAlarm(expiresAt);
  }
}
