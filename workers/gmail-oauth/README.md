# Gmail OAuth Broker — V4.4.2

This Worker provides only the OAuth connection foundation. It does not list, read, parse, or store Gmail messages, bodies, or attachments, and it does not create transactions. GitHub Pages never receives or stores OAuth tokens.

## Storage decision

The deployed Worker uses a Durable Object binding named `OAUTH_SESSIONS`. OAuth transactions and sessions are persisted in Durable Object storage, so they survive Worker instance eviction and restarts. A single environment-specific coordination object serializes state consumption, making OAuth state single-use. Expired records are rejected on read and removed by a Durable Object alarm. Access and refresh tokens are encrypted with AES-GCM before storage; plaintext tokens must never be passed to the store.

Alternatives considered:

- KV was rejected because eventual consistency is unsuitable for replay-safe, consume-once OAuth state.
- D1 can provide transactional consumption and TTL queries, but adds schema and query complexity without improving this small, strongly coordinated workload.
- `MemorySessionStore` remains available only for unit tests and local dependency injection. The deployed default fails closed when `OAUTH_SESSIONS` is absent.

## Environment isolation

`wrangler.jsonc` declares independent environments:

| Setting | Preview | Production |
| --- | --- | --- |
| Worker | `universal-rebalance-gmail-oauth-preview` | `universal-rebalance-gmail-oauth-production` |
| Environment | `preview` | `production` |
| Cookie | `__Host-ur_preview_oauth` | `__Host-ur_prod_oauth` |
| Frontend redirect | `https://hyc640110.github.io/family-universal-rebalance/preview/` | `https://hyc640110.github.io/family-universal-rebalance/` |
| Durable Object namespace | Preview Worker namespace | Production Worker namespace |
| Secrets | `wrangler secret ... --env preview` | `wrangler secret ... --env production` |

Cloudflare gives each named Worker environment a separate Durable Object namespace. Never deploy Production with `--env preview`, reuse Preview secrets, or copy Preview cookies.

## Google OAuth callback versus frontend redirect

These are different URLs:

- Google OAuth callback URI: the Worker endpoint that receives Google's authorization code.
- Frontend redirect target: the allowlisted page the Worker returns to after the callback succeeds.

In Google Cloud Console, enable the Gmail API, configure the OAuth consent screen, and create a Web application OAuth client for each environment. Add these exact authorized redirect URI formats, replacing `<account-subdomain>` with the Cloudflare workers.dev subdomain shown after deployment:

```text
Preview:    https://universal-rebalance-gmail-oauth-preview.<account-subdomain>.workers.dev/oauth/google/callback
Production: https://universal-rebalance-gmail-oauth-production.<account-subdomain>.workers.dev/oauth/google/callback
```

Do not register the GitHub Pages URL as the Google callback. The Preview frontend redirect target is:

```text
https://hyc640110.github.io/family-universal-rebalance/preview/
```

Production must remain disabled until Preview verification is complete and the user separately approves Production activation.

## Secrets

Never commit real values or place them in command arguments. Authenticate Wrangler, then enter each value interactively for Preview:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID --env preview --config workers/gmail-oauth/wrangler.jsonc
npx wrangler secret put GOOGLE_CLIENT_SECRET --env preview --config workers/gmail-oauth/wrangler.jsonc
npx wrangler secret put OAUTH_SESSION_SECRET --env preview --config workers/gmail-oauth/wrangler.jsonc
npx wrangler secret put TOKEN_ENCRYPTION_KEY --env preview --config workers/gmail-oauth/wrangler.jsonc
```

Use a cryptographically random, independent value for each of the last two secrets. Production requires its own four values with `--env production`; do not configure or deploy them during Preview setup. `.dev.vars.example` contains placeholders only. `.dev.vars` and `.dev.vars.*` are ignored by Git.

## Preview deployment

1. Run `npx wrangler whoami` and authenticate the intended Cloudflare account.
2. Configure the four Preview secrets above.
3. Validate without deploying:

   ```bash
   npx wrangler deploy --dry-run --env preview --config workers/gmail-oauth/wrangler.jsonc
   ```

4. Deploy only Preview:

   ```bash
   npx wrangler deploy --env preview --config workers/gmail-oauth/wrangler.jsonc
   ```

5. Copy the resulting Worker URL into a Preview-only Vite environment:

   ```text
   VITE_GMAIL_OAUTH_ENABLED=true
   VITE_GMAIL_OAUTH_BROKER_URL=https://universal-rebalance-gmail-oauth-preview.<account-subdomain>.workers.dev
   ```

   The feature remains disabled unless both variables are present. Never hardcode the Worker URL in a component.

6. Add the exact Worker callback URI to the Preview Google OAuth client, then build and publish only the existing Preview path. Do not modify Production GitHub Pages.

## Preview verification checklist

- `/oauth/google/start` redirects to Google with PKCE S256 and a single-use state.
- Google consent requests only `gmail.readonly`.
- `/oauth/google/callback` returns to the allowlisted Preview frontend target.
- `/oauth/google/status` recognizes the signed HttpOnly/Secure/SameSite=None cookie required for the cross-site GitHub Pages to workers.dev broker request.
- `/oauth/google/disconnect` requires the CSRF header and revokes the stored session.
- Disallowed origins and redirect targets are rejected or replaced with the configured safe target.
- Expired transactions and sessions fail safely.
- A session remains recognizable after a new Worker instance or restart.
- Preview credentials, cookie, Worker, and Durable Object namespace cannot access Production sessions.

## Current limitations

The repository contains deployable Preview configuration, but no real Google Client ID, Client Secret, Cloudflare secret, account subdomain, or deployed Worker URL. Production is configured only as an isolated template and is not enabled. V4.5 Gmail message access and parsing are explicitly out of scope.
