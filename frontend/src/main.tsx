import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply persisted theme before first paint to avoid a flash.
const stored = localStorage.getItem('theme')
const prefersDark =
  stored === 'dark' ||
  (stored === null &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', prefersDark)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
