import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AudioProvider } from './systems/AudioManager.jsx'
import { LanguageProvider } from './i18n/LanguageProvider.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
