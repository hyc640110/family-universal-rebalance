/**
 * UR-TODO-001: Firebase Anonymous Authentication, implemented as direct REST
 * calls (Identity Toolkit / Secure Token API) rather than the `firebase` SDK,
 * to stay consistent with the app's existing raw-fetch Firebase sync
 * architecture (no SDK dependency, no bundle size increase).
 *
 * The uid this produces is meant to be forward-compatible with a future
 * linkWithCredential() upgrade to a real account: uid stays the same across
 * that upgrade, so any data path keyed by uid never needs a migration.
 */

const SIGN_UP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';
const REFRESH_URL = 'https://securetoken.googleapis.com/v1/token';

/** Refresh proactively this far before actual expiry, so an in-flight request never races token expiry. */
export const FIREBASE_AUTH_EXPIRY_SAFETY_MARGIN_MS = 5 * 60 * 1000;

export type FirebaseAuthSession = {
  uid: string;
  idToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt: number;
};

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' && value ? value : '';
}

function toSession(uid: unknown, idToken: unknown, refreshToken: unknown, expiresIn: unknown, now: number): FirebaseAuthSession {
  const uidValue = nonEmptyString(uid);
  const idTokenValue = nonEmptyString(idToken);
  const refreshTokenValue = nonEmptyString(refreshToken);
  const expiresInSeconds = Number(expiresIn);
  if (!uidValue || !idTokenValue || !refreshTokenValue || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new Error('Firebase 匿名登入回應格式不正確');
  }
  return { uid: uidValue, idToken: idTokenValue, refreshToken: refreshTokenValue, expiresAt: now + expiresInSeconds * 1000 };
}

/** Identity Toolkit `accounts:signUp` uses camelCase fields (`localId`/`idToken`/`refreshToken`/`expiresIn`). */
export function parseSignUpResponse(raw: unknown, now: number): FirebaseAuthSession {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return toSession(record.localId, record.idToken, record.refreshToken, record.expiresIn, now);
}

/** Secure Token API `token` refresh uses snake_case fields (`user_id`/`id_token`/`refresh_token`/`expires_in`). */
export function parseRefreshResponse(raw: unknown, now: number): FirebaseAuthSession {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return toSession(record.user_id, record.id_token, record.refresh_token, record.expires_in, now);
}

/** True only when a persisted session is far enough from expiry to still be safely reusable without a network call. */
export function isSessionFresh(session: FirebaseAuthSession, now: number): boolean {
  return session.expiresAt - FIREBASE_AUTH_EXPIRY_SAFETY_MARGIN_MS > now;
}

async function firebaseAuthErrorMessage(res: Response, action: string): Promise<string> {
  try {
    const body = await res.json();
    const code = body && typeof body === 'object' ? (body as { error?: { message?: unknown } }).error?.message : undefined;
    return `Firebase ${action}失敗：${typeof code === 'string' && code ? code : res.status}`;
  } catch {
    return `Firebase ${action}失敗：HTTP ${res.status}`;
  }
}

export async function requestAnonymousSignUp(apiKey: string): Promise<unknown> {
  const res = await fetch(`${SIGN_UP_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!res.ok) throw new Error(await firebaseAuthErrorMessage(res, '匿名登入'));
  return res.json();
}

export async function requestTokenRefresh(apiKey: string, refreshToken: string): Promise<unknown> {
  const res = await fetch(`${REFRESH_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
  });
  if (!res.ok) throw new Error(await firebaseAuthErrorMessage(res, '登入更新'));
  return res.json();
}

/**
 * The persisted session lives in its own localStorage key, deliberately
 * outside AppState: it must never round-trip through JSON Backup, the
 * Firebase sync payload, or `assertNoOAuthSecrets` scanning of app data.
 */
export function readPersistedFirebaseAuthSession(storageKey: string): FirebaseAuthSession | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { uid, idToken, refreshToken, expiresAt } = parsed as Partial<FirebaseAuthSession>;
    if (!nonEmptyString(uid) || !nonEmptyString(idToken) || !nonEmptyString(refreshToken) || typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null;
    return { uid: uid as string, idToken: idToken as string, refreshToken: refreshToken as string, expiresAt };
  } catch {
    return null;
  }
}

export function writePersistedFirebaseAuthSession(storageKey: string, session: FirebaseAuthSession): void {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

export type FirebaseAuthOrchestrationDeps = {
  apiKey: string;
  now: number;
  persisted: FirebaseAuthSession | null;
  signUp: () => Promise<unknown>;
  refresh: (refreshToken: string) => Promise<unknown>;
};

/**
 * Reuses a fresh persisted session as-is; refreshes a stale one; falls back
 * to creating a brand-new anonymous user only when there is no persisted
 * session or its refresh token is no longer valid (e.g. revoked). Refreshing
 * never changes uid, so this is the only path a returning user takes.
 */
export async function ensureFirebaseAnonymousSession(deps: FirebaseAuthOrchestrationDeps): Promise<FirebaseAuthSession> {
  if (!deps.apiKey) throw new Error('Firebase 匿名登入設定缺少 API Key');
  if (deps.persisted && isSessionFresh(deps.persisted, deps.now)) return deps.persisted;
  if (deps.persisted) {
    try {
      const raw = await deps.refresh(deps.persisted.refreshToken);
      return parseRefreshResponse(raw, deps.now);
    } catch {
      // Refresh token no longer valid (e.g. revoked) — fall through to a fresh sign-up below.
    }
  }
  const raw = await deps.signUp();
  return parseSignUpResponse(raw, deps.now);
}

/**
 * Shares one in-flight manual Auth operation between multiple UI entry points.
 * This belongs at the App boundary: callers still decide when Auth is needed,
 * while concurrent clicks cannot create two anonymous users before persistence
 * records the first session.
 */
export function createFirebaseAnonymousSessionSingleFlight(ensure: () => Promise<FirebaseAuthSession>): () => Promise<FirebaseAuthSession> {
  let inFlight: Promise<FirebaseAuthSession> | null = null;
  return () => {
    if (inFlight) return inFlight;
    const current = ensure();
    inFlight = current;
    void current.then(
      () => { if (inFlight === current) inFlight = null; },
      () => { if (inFlight === current) inFlight = null; }
    );
    return current;
  };
}
