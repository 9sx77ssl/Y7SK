import type { Y7skApi } from '@shared/types'

declare global {
  interface Window {
    y7sk: Y7skApi
  }
}

export {}
