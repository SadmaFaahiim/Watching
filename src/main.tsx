import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Note: global styles are inlined in index.html (critical CSS) so first
// paint never waits on a stylesheet request.
import { initializeFirebase } from './lib/firebase';

// Initialize Firebase
initializeFirebase();

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
