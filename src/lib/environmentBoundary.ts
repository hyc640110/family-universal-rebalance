export type DeploymentEnvironment = 'preview' | 'production';

const configurationError = () => new Error('環境隔離設定無效，應用程式未啟動。');

export function normalizeDeploymentScope(value: string | undefined): string {
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

export function createEnvironmentBoundary(environmentValue: string | undefined, deploymentScopeValue: string | undefined) {
  const environment = environmentIdentity(environmentValue);
  const deploymentScope = normalizeDeploymentScope(deploymentScopeValue);
  const isPreviewScope = deploymentScope.endsWith('-preview');

  if ((environment === 'preview' && !isPreviewScope) || (environment === 'production' && isPreviewScope)) throw configurationError();

  return {
    environment,
    deploymentScope
  };
}
