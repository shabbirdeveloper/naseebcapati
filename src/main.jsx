import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadPublicContentCache } from './lib/supabase';
import './styles.css';

async function startApp() {
  if (!window.location.pathname.startsWith('/admin')) {
    let timeoutId;
    const cachePromise = loadPublicContentCache().catch((error) => {
      console.warn('Public content cache could not be loaded; starting with the local content layer.', error);
    });
    await Promise.race([
      cachePromise,
      new Promise((resolve) => { timeoutId = window.setTimeout(resolve, 5000); }),
    ]);
    window.clearTimeout(timeoutId);
  }
  try {
    const { default: App } = await import('./App');
    createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Application startup failed:', error);
    const root = document.getElementById('root');
    if (root) root.innerHTML = '<main style="display:grid;place-items:center;min-height:100vh;padding:32px;background:#f7f8f6;color:#111;text-align:center;font-family:Montserrat,system-ui,sans-serif"><div><h1>We are restoring the website.</h1><p>Please reload this page to continue.</p><button style="padding:12px 18px;border:0;border-radius:10px;background:#1f4d3a;color:#fff;font-weight:700;cursor:pointer" onclick="location.reload()">Reload page</button></div></main>';
  }
}

startApp();
