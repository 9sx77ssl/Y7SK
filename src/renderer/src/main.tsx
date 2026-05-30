import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@renderer/App'
import '@renderer/styles/global.css'
import '@renderer/styles/titlebar.css'
import '@renderer/styles/settings.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
