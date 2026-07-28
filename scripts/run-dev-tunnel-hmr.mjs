/**
 * Starts Vite with DEV_HMR_TUNNEL=1 (Cloudflare Tunnel / HTTPS device HMR).
 * Single source of truth remains the env flag read by vite.config.ts.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')

const child = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    DEV_HMR_TUNNEL: '1',
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
