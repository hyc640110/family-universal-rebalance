export type DeploymentEnvironment = 'preview' | 'production';

const configurationError = () => new Error('環境隔離設定無效，應用程式未啟動。');

export function normalizeFirebaseBasePath(value: string | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '/' || raw.includes('//')) throw configurationError();
  const normalized = raw.replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized === '.' || normalized.includes('/')) throw configurationError();
  return normalized;
}

export function environmentIdentity(value: string | undefined): DeploymentEnvironment {
  const environment = String(value ?? '').trim();
  if (environment === 'preview' || environment === 'production') return environment;
  throw configurationError();
}

export function createEnvironmentBoundary(environmentValue: string | undefined, firebaseBasePathValue: string | undefined) {
  const environment = environmentIdentity(environmentValue);
  const firebaseBasePath = normalizeFirebaseBasePath(firebaseBasePathValue);
  const isPreviewRoot = firebaseBasePath.endsWith('-preview');

  if ((environment === 'preview' && !isPreviewRoot) || (environment === 'production' && isPreviewRoot)) throw configurationError();

  return {
    environment,
    firebaseBasePath,
    syncRoot(secretPath: string | undefined) {
      return `${firebaseBasePath}/${encodeURIComponent(secretPath || firebaseBasePath)}`;
    }
  };
}
