/**
 * UR-TODO-001: builds an authenticated Firebase Realtime Database REST URL.
 * The app never uses the Firebase SDK's `database()` client — it PUTs/GETs a
 * whole JSON node via plain `fetch()`, so an ID token is attached the same
 * way the RTDB REST API expects: an `auth` query parameter, not a header.
 */
export function buildFirebaseSyncUrl(databaseURL: string, syncRootPath: string, idToken: string): string {
  const db = databaseURL.trim();
  if (!db) throw new Error('請先輸入 Firebase URL');
  if (!syncRootPath) throw new Error('缺少同步路徑');
  if (!idToken) throw new Error('缺少登入憑證，無法呼叫 Firebase');
  return `${db.replace(/\/$/, '')}/${syncRootPath}.json?auth=${encodeURIComponent(idToken)}`;
}
