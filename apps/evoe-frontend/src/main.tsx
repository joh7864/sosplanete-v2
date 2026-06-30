import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Enregistrement du Service Worker uniquement en production pour éviter les conflits de cache en développement
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // En dev, on nettoie activement les anciens Service Workers pour éviter les bugs de cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Service Worker de développement désenregistré avec succès pour éviter les conflits de cache.');
            window.location.reload(); // Recharger une fois pour nettoyer le cache d'interception
          }
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker enregistré avec succès :', reg.scope))
        .catch((err) => console.error('Échec de l\'enregistrement du Service Worker :', err));
    });
  }
}
