import { encryptToken, MemorySessionStore, pkce, type OAuthStore } from './security';

export interface Env { GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string; OAUTH_SESSION_SECRET: string; TOKEN_ENCRYPTION_KEY: string; ENVIRONMENT: string; ALLOWED_ORIGINS: string; ALLOWED_REDIRECTS: string; }
const scope = 'https://www.googleapis.com/auth/gmail.readonly';
const configured = (env: Env) => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENCRYPTION_KEY && !/replace-with/i.test(env.GOOGLE_CLIENT_ID));
const list = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const audience = (request: Request) => request.headers.get('Origin') || '';
const allowedOrigin = (request: Request, env: Env) => { const origin = audience(request); return list(env.ALLOWED_ORIGINS).includes(origin) ? origin : ''; };
const defaultRedirect = (env: Env) => list(env.ALLOWED_REDIRECTS)[0] || '';
const headers = (origin?: string) => ({ 'content-type': 'application/json', ...(origin ? { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' } : {}) });
const json = (value: unknown, origin?: string, status = 200) => new Response(JSON.stringify(value), { status, headers: headers(origin) });
const cookieName = (environment: string) => environment === 'production' ? '__Host-ur_prod_oauth' : '__Host-ur_preview_oauth';
const sessionCookie = (environment: string, value = '', maxAge = 0) => `${cookieName(environment)}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const parseCookie = (request: Request, name: string) => request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || '';
const safeRedirect = (value: string | null, env: Env) => list(env.ALLOWED_REDIRECTS).includes(value || '') ? value! : defaultRedirect(env);
const csrfOk = (request: Request) => request.headers.get('x-requested-with') === 'universal-rebalance';

export function createOAuthWorker(store: OAuthStore = new MemorySessionStore()) {
  return { async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env); const url = new URL(request.url); const path = url.pathname;
    if (request.method === 'OPTIONS') return origin ? new Response(null, { headers: { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-requested-with', vary: 'Origin' } }) : new Response('forbidden', { status: 403 });
    if (!origin && path !== '/oauth/google/callback') return json({ error: 'origin_not_allowed' }, undefined, 403);
    if (path === '/oauth/google/status' && request.method === 'GET') { const id = parseCookie(request, cookieName(env.ENVIRONMENT)); const session = id ? store.getSession(id, origin) : undefined; return json(session ? { status: 'connected', grantedScopes: session.scopes, expiresAt: new Date(session.expiresAt).toISOString(), lastCheckedAt: new Date().toISOString() } : { status: 'disconnected', grantedScopes: [], lastCheckedAt: new Date().toISOString() }, origin); }
    if (path === '/oauth/google/disconnect' && request.method === 'POST') { if (!csrfOk(request)) return json({ error: 'csrf_required' }, origin, 403); const id = parseCookie(request, cookieName(env.ENVIRONMENT)); if (id) store.deleteSession(id); return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie(env.ENVIRONMENT), 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' } }); }
    if (path === '/oauth/google/start' && request.method === 'GET') { if (!configured(env)) return json({ error: 'oauth_not_configured' }, origin, 503); const redirect = safeRedirect(url.searchParams.get('redirect'), env); const proof = await pkce(); const transaction = store.createOAuthTransaction(redirect, origin, proof.verifier); const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/oauth/google/callback`, response_type: 'code', scope, state: transaction.state, code_challenge: proof.challenge, code_challenge_method: proof.method, include_granted_scopes: 'true', access_type: 'offline', prompt: 'consent' }); return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302); }
    if (path === '/oauth/google/callback' && request.method === 'GET') { const state = url.searchParams.get('state') || ''; const code = url.searchParams.get('code') || ''; try { const transaction = store.consumeOAuthTransaction(state); if (!configured(env) || !code) throw new Error('oauth_not_configured'); const encryptedToken = await encryptToken(code, env.TOKEN_ENCRYPTION_KEY); const id = store.createSession(transaction.audience, [scope], encryptedToken); return new Response(null, { status: 302, headers: { location: transaction.redirectTarget, 'set-cookie': sessionCookie(env.ENVIRONMENT, id, 3600) } }); } catch { return Response.redirect(`${defaultRedirect(env)}?gmail_oauth=error`, 302); } }
    return json({ error: 'not_found' }, origin, 404);
  } };
}
export default createOAuthWorker();
