import { readFileSync } from 'node:fs';

const expected = {
  production: {
    file: '.env.production',
    values: {
      VITE_APP_BASE: '/family-universal-rebalance/',
      VITE_DEPLOYMENT_ENVIRONMENT: 'production',
      VITE_FIREBASE_BASE_PATH: 'family-universal-rebalance',
      VITE_STORAGE_KEY: 'family-universal-rebalance-v100-state',
      VITE_WORKER_URL: 'https://00631l-pro-price-proxy.hyc640110.workers.dev',
      VITE_MARKET_DATA_WORKER_URL: 'https://family-universal-rebalance-market-data-production.hyc640110.workers.dev'
    }
  },
  preview: {
    file: '.env.preview-deploy',
    values: {
      VITE_APP_BASE: '/family-universal-rebalance/preview/',
      VITE_DEPLOYMENT_ENVIRONMENT: 'preview',
      VITE_FIREBASE_BASE_PATH: 'family-universal-rebalance-preview',
      VITE_STORAGE_KEY: 'family-universal-rebalance-preview-v100-state',
      VITE_WORKER_URL: 'https://00631l-pro-price-proxy-preview.hyc640110.workers.dev',
      VITE_MARKET_DATA_WORKER_URL: 'https://family-universal-rebalance-market-data-preview.hyc640110.workers.dev'
    }
  }
};

export const parseEnv = contents => Object.fromEntries(contents.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));

export function assertEnvironmentBoundary(mode, env) {
  const contract = expected[mode];
  if (!contract) throw new Error('Invalid environment boundary configuration.');
  for (const [key, value] of Object.entries(contract.values)) {
    if (env[key] !== value) throw new Error('Invalid environment boundary configuration.');
  }
  if (env.VITE_STORAGE_KEY === env.VITE_FIREBASE_BASE_PATH || !String(env.VITE_FIREBASE_BASE_PATH ?? '').trim()) throw new Error('Invalid environment boundary configuration.');
  return contract;
}

const mode = process.argv[2];
if (mode) {
  const contract = expected[mode];
  if (!contract) throw new Error('Invalid environment boundary configuration.');
  assertEnvironmentBoundary(mode, parseEnv(readFileSync(contract.file, 'utf8')));
  process.stdout.write(`Environment boundary contract verified for ${mode}.\n`);
}
