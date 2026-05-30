import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// bun's process.stdout lacks the TTY readline methods electron-vite's progress
// reporter calls — shim them as no-ops so the build runs under `bun run`.
const stdout = process.stdout as unknown as Record<string, unknown>
for (const m of ['clearLine', 'cursorTo', 'moveCursor']) {
  if (typeof stdout[m] !== 'function') stdout[m] = () => {}
}

const root = dirname(fileURLToPath(import.meta.url))
const r = (...p: string[]): string => resolve(root, ...p)

// electron-vite 5 externalizes node/electron deps for main & preload by default.
export default defineConfig({
  main: {
    resolve: {
      alias: { '@shared': r('src/shared') }
    },
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: r('src/main/index.ts') }
      }
    }
  },
  preload: {
    resolve: {
      alias: { '@shared': r('src/shared') }
    },
    // sandbox:true needs each preload fully bundled into ONE self-contained
    // CommonJS file (its restricted require() can't load relative chunks).
    // isolatedEntries builds each entry separately so shared @shared/* imports
    // inline into both instead of becoming a shared chunk.
    build: {
      outDir: 'out/preload',
      isolatedEntries: true,
      externalizeDeps: false,
      rollupOptions: {
        input: {
          index: r('src/preload/index.ts'),
          scbridge: r('src/preload/scbridge.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    root: r('src/renderer'),
    resolve: {
      alias: {
        '@renderer': r('src/renderer/src'),
        '@shared': r('src/shared')
      }
    },
    plugins: [react()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: { index: r('src/renderer/index.html') }
      }
    }
  }
})
