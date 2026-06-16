import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Clean up and unregister any active PWA service workers to resolve cache traps
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service Worker unregistered successfully.');
          // Clean cache storage as well
          if (window.caches) {
            caches.keys().then((keys) => {
              keys.forEach((key) => caches.delete(key));
            });
          }
        }
      });
    }
  });
}


