import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'

const gitCommit = () => {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return 'unavailable'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const buildTime = env.VITE_BUILD_TIME?.trim() || 'unavailable'

  return {
    base: env.VITE_APP_BASE || '/family-universal-rebalance/',
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GIT_COMMIT': JSON.stringify(gitCommit()),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    },
  }
})
