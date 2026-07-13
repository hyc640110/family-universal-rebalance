export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export type GmailOAuthStatus = 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';
export type GmailOAuthState = { status: GmailOAuthStatus; connectedAt?: string; expiresAt?: string; grantedScopes: string[]; lastErrorCode?: string; lastCheckedAt?: string };
export const GMAIL_OAUTH_SCHEMA_VERSION = 1;
export const disconnectedGmailOAuth = (): GmailOAuthState => ({ status: 'disconnected', grantedScopes: [] });
export const redactOAuthError = (value: unknown) => String(value ?? '連線失敗').replace(/(access_token|refresh_token|code|client_secret|email)=?[^\s&]+/gi, '$1=[已遮蔽]').slice(0, 160);
export const normalizeGmailOAuth = (value: unknown): GmailOAuthState => {
  const raw = value && typeof value === 'object' ? value as Partial<GmailOAuthState> : {};
  const status: GmailOAuthStatus = ['disconnected', 'connecting', 'connected', 'expired', 'error'].includes(raw.status || '')
    ? raw.status as GmailOAuthStatus
    : 'disconnected';
  return {
    status,
    grantedScopes: Array.isArray(raw.grantedScopes) ? raw.grantedScopes.filter(scope => scope === GMAIL_READONLY_SCOPE) : [],
    connectedAt: raw.connectedAt,
    expiresAt: raw.expiresAt,
    lastErrorCode: raw.lastErrorCode ? redactOAuthError(raw.lastErrorCode) : undefined,
    lastCheckedAt: raw.lastCheckedAt
  };
};
const SENSITIVE_PERSISTENCE_KEYS = new Set([
  'accesstoken', 'refreshtoken', 'authorizationcode', 'oauthcode', 'clientsecret', 'googlepassword', 'password',
  'codeverifier', 'pkceverifier', 'oauthstate', 'oauthtransactionstate',
  'encryptedtoken', 'encryptedrefreshtoken', 'tokenciphertext'
]);
/** Canonicalize only separators and case, then use an exact denylist: no substring matching. */
export const canonicalPersistenceKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '');
export function scanSensitivePersistenceKeys(value: unknown): string | undefined {
  const visit = (entry: unknown): string | undefined => {
    if (Array.isArray(entry)) { for (const item of entry) { const found = visit(item); if (found) return found; } return undefined; }
    if (!entry || typeof entry !== 'object') return undefined;
    for (const [key, nested] of Object.entries(entry as Record<string, unknown>)) {
      const canonical = canonicalPersistenceKey(key);
      if (SENSITIVE_PERSISTENCE_KEYS.has(canonical)) return canonical;
      const found = visit(nested); if (found) return found;
    }
    return undefined;
  };
  return visit(value);
}
export function assertNoOAuthSecrets(value: unknown): void {
  const found = scanSensitivePersistenceKeys(value);
  if (found) throw new Error(`OAuth 敏感資料不可持久化：${found}`);
}
export const oauthBrokerUrl = () => import.meta.env.VITE_GMAIL_OAUTH_BROKER_URL || '';
export const isGmailOAuthEnabled = () => import.meta.env.VITE_GMAIL_OAUTH_ENABLED === 'true' && Boolean(oauthBrokerUrl());
export async function getGoogleOAuthStatus(): Promise<GmailOAuthState> { const base = oauthBrokerUrl(); if (!base) return disconnectedGmailOAuth(); const response = await fetch(`${base}/oauth/google/status`, { credentials: 'include' }); if (!response.ok) return { status: 'error', grantedScopes: [], lastErrorCode: 'broker_unavailable' }; return normalizeGmailOAuth(await response.json()); }
export function startGoogleOAuth(): void { const base = oauthBrokerUrl(); if (!isGmailOAuthEnabled() || !base) throw new Error('Gmail 安全連線尚未啟用'); const redirect = new URL(import.meta.env.BASE_URL, window.location.origin).toString(); window.location.assign(`${base}/oauth/google/start?redirect=${encodeURIComponent(redirect)}`); }
export async function disconnectGoogleOAuth(): Promise<void> { const base = oauthBrokerUrl(); if (!base) return; const response = await fetch(`${base}/oauth/google/disconnect`, { method: 'POST', credentials: 'include', headers: { 'x-requested-with': 'universal-rebalance' } }); if (!response.ok) throw new Error('broker_unavailable'); }
