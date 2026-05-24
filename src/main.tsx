import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('גרסה חדשה זמינה. לרענן?')) {
      void updateSW(true)
    }
  },
  onOfflineReady() {
    console.info('[PWA] האפליקציה מוכנה לשימוש לא מקוון')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
