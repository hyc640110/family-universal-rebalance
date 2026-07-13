export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export type GmailOAuthStatus = 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';
export type GmailOAuthState = { status: GmailOAuthStatus; connectedAt?: string; expiresAt?: string; grantedScopes: string[]; lastErrorCode?: string; lastCheckedAt?: string };
export const GMAIL_OAUTH_SCHEMA_VERSION = 1;
export const disconnectedGmailOAuth = (): GmailOAuthState => ({ status: 'disconnected', grantedScopes: [] });
export const redactOAuthError = (value: unknown) => String(value ?? '連線失敗').replace(/(access_token|refresh_token|code|client_secret|email)=?[^\s&]+/gi, '$1=[已遮蔽]').slice(0, 160);
export const normalizeGmailOAuth = (value: unknown): GmailOAuthState => { const raw = value && typeof value === 'object' ? value as Partial<GmailOAuthState> : {}; const status: GmailOAuthStatus = ['disconnected', 'connecting', 'connected', 'expired', 'error'].includes(raw.status || '') ? raw.status as GmailOAuthStatus : 'disconnected'; return status === 'connected' ? { status: 'disconnected', grantedScopes: [], lastCheckedAt: raw.lastCheckedAt } : { status, grantedScopes: Array.isArray(raw.grantedScopes) ? raw.grantedScopes.filter(scope => scope === GMAIL_READONLY_SCOPE) : [], lastErrorCode: raw.lastErrorCode ? redactOAuthError(raw.lastErrorCode) : undefined, lastCheckedAt: raw.lastCheckedAt }; };
const sensitiveKey = /(^|[-_\s])(access[-_\s]?token|refresh[-_\s]?token|authorization[-_\s]?code|client[-_\s]?secret|id[-_\s]?token|oauth[-_\s]?token)([-_\s]|$)/i;
export function assertNoOAuthSecrets(value: unknown): void {
  const visit = (entry: unknown): void => {
    if (Array.isArray(entry)) return entry.forEach(visit);
    if (!entry || typeof entry !== 'object') return;
    Object.entries(entry as Record<string, unknown>).forEach(([key, nested]) => {
      if (sensitiveKey.test(key)) throw new Error('OAuth 敏感資料不可持久化');
      visit(nested);
    });
  };
  visit(value);
}
export const oauthBrokerUrl = () => import.meta.env.VITE_GMAIL_OAUTH_BROKER_URL || '';
export const isGmailOAuthEnabled = () => import.meta.env.VITE_GMAIL_OAUTH_ENABLED === 'true';
export async function getGoogleOAuthStatus(): Promise<GmailOAuthState> { const base = oauthBrokerUrl(); if (!base) return disconnectedGmailOAuth(); const response = await fetch(`${base}/oauth/google/status`, { credentials: 'include' }); if (!response.ok) return { status: 'error', grantedScopes: [], lastErrorCode: 'broker_unavailable' }; return normalizeGmailOAuth(await response.json()); }
export function startGoogleOAuth(): void { const base = oauthBrokerUrl(); if (!isGmailOAuthEnabled() || !base) throw new Error('Gmail 安全連線尚未啟用'); window.location.assign(`${base}/oauth/google/start`); }
export async function disconnectGoogleOAuth(): Promise<void> { const base = oauthBrokerUrl(); if (!base) return; const response = await fetch(`${base}/oauth/google/disconnect`, { method: 'POST', credentials: 'include', headers: { 'x-requested-with': 'universal-rebalance' } }); if (!response.ok) throw new Error('broker_unavailable'); }
