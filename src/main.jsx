import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Ensure chatHistory manager is initialized before hooks/components run
import './utils/chatHistory'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No #root element found in index.html')
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
