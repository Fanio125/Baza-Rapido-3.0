import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// 1. Global console error and warn interceptor for Google Maps API restrictions
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const isMapsMessage = (msg: string): boolean => {
  return (
    msg.includes('LegacyApiNotActivatedMapError') ||
    msg.includes('legacy#LegacyApiNotActivatedMapError') ||
    msg.includes('billing') ||
    msg.includes('Billing') ||
    msg.includes('billing/enable') ||
    msg.includes('DIRECTIONS_ROUTE') ||
    msg.includes('REQUEST_DENIED') ||
    msg.includes('Directions Service') ||
    msg.includes('ApiTargetBlockedMapError')
  );
};

console.error = (...args: any[]) => {
  const msg = args.map(arg => {
    try {
      return typeof arg === 'string' ? arg : (arg?.message || JSON.stringify(arg) || '');
    } catch {
      return '';
    }
  }).join(' ');

  if (isMapsMessage(msg)) {
    console.log('[Google Maps Global Intercept Info] Safely handled credential or API limitation:', msg);
    // Dispatch custom event so our UI components can show appropriate warning fallbacks
    window.dispatchEvent(new CustomEvent('google-maps-api-error', { detail: { message: msg } }));
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const msg = args.map(arg => {
    try {
      return typeof arg === 'string' ? arg : (arg?.message || JSON.stringify(arg) || '');
    } catch {
      return '';
    }
  }).join(' ');

  if (isMapsMessage(msg)) {
    console.log('[Google Maps Global Intercept Warning] Safely handled credential or API limitation warning:', msg);
    window.dispatchEvent(new CustomEvent('google-maps-api-error', { detail: { message: msg } }));
    return;
  }
  originalConsoleWarn.apply(console, args);
};

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

