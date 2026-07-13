# Gmail OAuth Broker

This Worker is an undeployed security foundation. GitHub Pages never stores refresh tokens. No OAuth secret is included in this repository. Before a future deployment, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_SESSION_SECRET`, and `TOKEN_ENCRYPTION_KEY` through the Cloudflare secret manager; never commit `.dev.vars`.

Preview and production require separate Worker environments, redirect paths, cookie names, audiences, and persistent-store namespaces. The included memory store is for tests/local development only and is not production-ready. A production KV/D1/Durable Object adapter must be configured before deployment.

Routes are limited to `/oauth/google/start`, `/oauth/google/callback`, `/oauth/google/status`, and `/oauth/google/disconnect`. They use PKCE S256, short-lived single-use state, HttpOnly/Secure/SameSite cookies, exact-origin CORS, a redirect allowlist, and CSRF protection for disconnect.

Only `gmail.readonly` is requested. This sprint does not read Gmail messages or bodies, parse notifications, create transactions, or deploy a Worker.
