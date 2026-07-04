import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { initializeSupabaseLogger } from './utils/supabaseLogger';

// Initialize the central Supabase & offline logger system
initializeSupabaseLogger();

// 1. Register global error and unhandled rejection event boundaries to prevent native/third-party exceptions from failing telemetry
window.addEventListener('error', (event) => {
  const errorMsg = event.message || '';
  const errorObjMsg = event.error?.message || '';
  const combined = `${errorMsg} ${errorObjMsg}`.toLowerCase();
  
  if (
    combined.includes('steal') || 
    combined.includes('lock broken') || 
    combined.includes('fetch') || 
    combined.includes('network')
  ) {
    console.log('[Global Error Boundary Intercept] Mitigated benign exception gracefully:', event.message || event.error?.message);
    window.dispatchEvent(new CustomEvent('baza-rapido-system-log', {
      detail: {
        category: 'Erros',
        title: 'Exceção Global Mitigada',
        description: event.message || event.error?.message || 'Erro de rede ou bloqueio de banco de dados'
      }
    }));
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonMsg = reason?.message || String(reason || '');
  const combined = reasonMsg.toLowerCase();
  
  if (
    combined.includes('steal') || 
    combined.includes('lock broken') || 
    combined.includes('fetch') || 
    combined.includes('network')
  ) {
    console.log('[Global Rejection Boundary Intercept] Mitigated benign unhandled rejection:', reasonMsg);
    window.dispatchEvent(new CustomEvent('baza-rapido-system-log', {
      detail: {
        category: 'Erros',
        title: 'Rejeição de Promessa Mitigada',
        description: reasonMsg
      }
    }));
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

// 2. Global console error and warn interceptor for Google Maps API restrictions and benign fetch/lock flags
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

const isBenignException = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('lock broken') ||
    lower.includes('steal') ||
    lower.includes('network') ||
    lower.includes('unauthenticated') ||
    lower.includes('não autenticado')
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

  if (isBenignException(msg)) {
    console.log('[BazaRapido System Monitor Intercept] Benign error logged to standard console stream:', msg);
    window.dispatchEvent(new CustomEvent('baza-rapido-system-log', {
      detail: {
        category: 'Erros',
        title: 'Falha de Ligação / Rede',
        description: msg
      }
    }));
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

  if (isBenignException(msg)) {
    console.log('[BazaRapido System Monitor Intercept] Benign warning logged to standard console stream:', msg);
    window.dispatchEvent(new CustomEvent('baza-rapido-system-log', {
      detail: {
        category: 'Sistema',
        title: 'Aviso de Ligação / Cache',
        description: msg
      }
    }));
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

