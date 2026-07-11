import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadPublicContentCache } from './lib/supabase';
import './styles.css';

async function startApp() {
  await loadPublicContentCache();
  const { default: App } = await import('./App');
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

startApp();
