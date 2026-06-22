import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { debug } from './lib/debug.js';
import App from './App.jsx';

debug.info('Bootstrap', 'Application starting…');

const rootEl = document.getElementById('root');

if (!rootEl) {
  debug.error('Bootstrap', 'Root element #root not found in DOM');
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  debug.info('Bootstrap', 'App mounted successfully');
}
