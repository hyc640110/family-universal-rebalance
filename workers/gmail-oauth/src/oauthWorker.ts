import { DurableObjectOAuthStore, type OAuthSessionStub } from './oauthStore';
import { encryptToken, pkce, signSessionId, verifySessionId, type OAuthStore } from './security';

interface DurableObjectNamespaceBinding { getByName(name: string): OAuthSessionStub }
export interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OAUTH_SESSION_SECRET: string;
  TOKEN_ENCRYPTION_KEY: string;
  ENVIRONMENT: 'preview' | 'production';
  ALLOWED_ORIGINS: string;
  ALLOWED_REDIRECTS: string;
  OAUTH_SESSIONS?: DurableObjectNamespaceBinding;
}

const scope = 'https://www.googleapis.com/auth/gmail.readonly';
const configured = (env: Env) => Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.OAUTH_SESSION_SECRET && env.TOKEN_ENCRYPTION_KEY
  && !Object.values({ client: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, session: env.OAUTH_SESSION_SECRET, encryption: env.TOKEN_ENCRYPTION_KEY }).some(value => /replace-with|placeholder/i.test(value))
);
const list = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const requestOrigin = (request: Request) => request.headers.get('Origin') || '';
const allowedOrigin = (request: Request, env: Env) => { const origin = requestOrigin(request); return list(env.ALLOWED_ORIGINS).includes(origin) ? origin : ''; };
const defaultRedirect = (env: Env) => list(env.ALLOWED_REDIRECTS)[0] || '';
const headers = (origin?: string) => ({ 'content-type': 'application/json', ...(origin ? { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' } : {}) });
const json = (value: unknown, origin?: string, status = 200) => new Response(JSON.stringify(value), { status, headers: headers(origin) });
export const cookieName = (environment: string) => environment === 'production' ? '__Host-ur_prod_oauth' : '__Host-ur_preview_oauth';
const sessionCookie = (environment: string, value = '', maxAge = 0) => `${cookieName(environment)}=${value}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
const parseCookie = (request: Request, name: string) => request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || '';
export const safeRedirect = (value: string | null, env: Env) => list(env.ALLOWED_REDIRECTS).includes(value || '') ? value! : defaultRedirect(env);
const csrfOk = (request: Request) => request.headers.get('x-requested-with') === 'universal-rebalance';
type GoogleTokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };

async function exchangeAuthorizationCode(origin: string, env: Env, code: string, verifier: string): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: `${origin}/oauth/google/callback` })
  });
  const payload = await response.json().catch(() => ({})) as GoogleTokenResponse;
  if (!response.ok || !payload.access_token) throw new Error('oauth_token_exchange_failed');
  return payload;
}

const boundStore = (env: Env) => {
  if (!env.OAUTH_SESSIONS) throw new Error('oauth_production_store_not_configured');
  return new DurableObjectOAuthStore(env.OAUTH_SESSIONS.getByName(`oauth-${env.ENVIRONMENT}`));
};

export function createOAuthWorker(storeFactory: (env: Env) => OAuthStore = boundStore) {
  return { async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env); const url = new URL(request.url); const path = url.pathname;
    if (request.method === 'OPTIONS') return origin ? new Response(null, { headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-requested-with', vary: 'Origin' } }) : new Response('forbidden', { status: 403 });
    if (!origin && path !== '/oauth/google/callback' && path !== '/oauth/google/start') return json({ error: 'origin_not_allowed' }, undefined, 403);
    let store: OAuthStore;
    try { store = storeFactory(env); } catch { return json({ error: 'oauth_store_not_configured' }, origin, 503); }
    if (path === '/oauth/google/status' && request.method === 'GET') {
      const signedId = parseCookie(request, cookieName(env.ENVIRONMENT));
      const id = signedId ? await verifySessionId(signedId, env.OAUTH_SESSION_SECRET) : '';
      const session = id ? await store.getSession(id, origin) : undefined;
      return json(session ? { status: 'connected', grantedScopes: session.scopes, expiresAt: new Date(session.expiresAt).toISOString(), lastCheckedAt: new Date().toISOString() } : { status: 'disconnected', grantedScopes: [], lastCheckedAt: new Date().toISOString() }, origin);
    }
    if (path === '/oauth/google/disconnect' && request.method === 'POST') {
      if (!csrfOk(request)) return json({ error: 'csrf_required' }, origin, 403);
      const signedId = parseCookie(request, cookieName(env.ENVIRONMENT));
      const id = signedId ? await verifySessionId(signedId, env.OAUTH_SESSION_SECRET) : '';
      if (id) await store.deleteSession(id);
      return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie(env.ENVIRONMENT), 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' } });
    }
    if (path === '/oauth/google/start' && request.method === 'GET') {
      if (!configured(env)) return json({ error: 'oauth_not_configured' }, origin, 503);
      const requestedRedirect = url.searchParams.get('redirect');
      if (!origin && !list(env.ALLOWED_REDIRECTS).includes(requestedRedirect || '')) return json({ error: 'redirect_not_allowed' }, undefined, 403);
      const redirect = safeRedirect(requestedRedirect, env);
      const transactionAudience = origin || new URL(redirect).origin;
      const proof = await pkce();
      const transaction = await store.createOAuthTransaction(redirect, transactionAudience, proof.verifier);
      const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/oauth/google/callback`, response_type: 'code', scope, state: transaction.state, code_challenge: proof.challenge, code_challenge_method: proof.method, include_granted_scopes: 'true', access_type: 'offline', prompt: 'consent' });
      return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
    }
    if (path === '/oauth/google/callback' && request.method === 'GET') {
      const state = url.searchParams.get('state') || ''; const code = url.searchParams.get('code') || '';
      try {
        if (!configured(env) || !code) throw new Error('oauth_not_configured');
        const transaction = await store.consumeOAuthTransaction(state);
        const token = await exchangeAuthorizationCode(url.origin, env, code, transaction.codeVerifier);
        const encryptedToken = await encryptToken(JSON.stringify({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresIn: token.expires_in }), env.TOKEN_ENCRYPTION_KEY);
        const id = await store.createSession(transaction.audience, [scope], encryptedToken);
        const signedId = await signSessionId(id, env.OAUTH_SESSION_SECRET);
        return new Response(null, { status: 302, headers: { location: transaction.redirectTarget, 'set-cookie': sessionCookie(env.ENVIRONMENT, signedId, 3600) } });
      } catch { return Response.redirect(`${defaultRedirect(env)}?gmail_oauth=error`, 302); }
    }
    return json({ error: 'not_found' }, origin, 404);
  } };
}
