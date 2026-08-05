import { createEnvironmentBoundary } from '../lib/environmentBoundary';

export const APP_VERSION = 'Universal Rebalance V5.10.1';
export const APP_BUILD_TIME = import.meta.env.VITE_BUILD_TIME || 'unavailable';
export const APP_GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || 'unavailable';
export const APP_NAME = '萬用資產再平衡儀表板';
export const APP_SUBTITLE = '家庭多資產配置管理';

const environmentBoundary = createEnvironmentBoundary(import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT, import.meta.env.VITE_FIREBASE_BASE_PATH);

export const DEPLOYMENT_ENVIRONMENT = environmentBoundary.environment;
export const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'family-universal-rebalance-v100-state';
export const FIREBASE_BASE_PATH = environmentBoundary.firebaseBasePath;
export const buildFirebaseSyncRoot = environmentBoundary.syncRoot;
export const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://00631l-pro-price-proxy.hyc640110.workers.dev';
/** UR-TODO-001: Firebase Web API Key, safe to expose client-side (not a secret; access control is enforced by Security Rules). */
export const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || '';
/**
 * Deliberately separate from STORAGE_KEY: the Anonymous Auth session
 * (idToken/refreshToken) must never round-trip through AppState, JSON
 * Backup, or the Firebase sync payload. Namespaced by STORAGE_KEY (already
 * environment-specific) because Preview and Production share the same
 * origin and therefore the same localStorage.
 */
export const FIREBASE_AUTH_SESSION_STORAGE_KEY = `${STORAGE_KEY}:firebase-auth-session`;
