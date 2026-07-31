import { createRoot } from 'react-dom/client'
import { EnfyraProvider } from '@enfyra/sdk-react'
import { App } from './App'
import './index.css'

const baseUrl = import.meta.env.VITE_ENFYRA_URL || 'http://localhost:3000'

createRoot(document.getElementById('root')!).render(
  <EnfyraProvider config={{ baseUrl }}>
    <App />
  </EnfyraProvider>,
)
