import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))
const r = (...p: string[]): string => resolve(root, ...p)

// electron-vite 5 externalizes node/electron deps for main & preload by default.
export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: { index: r('src/main/index.ts') }
      }
    }
  },
  preload: {
    // sandbox:true requires a CommonJS preload bundle — force CJS output.
    build: {
      outDir: 'out/preload',
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
