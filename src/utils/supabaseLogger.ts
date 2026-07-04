import { supabase } from '../lib/supabase';
import { addAdminNotification, AdminNotification } from './adminNotifications';

export interface SystemLog {
  id?: string;
  created_at?: string;
  category: 'API' | 'Erros' | 'Segurança' | 'Sistema' | 'Manutenção';
  message: string;
  details: string;
  user_email?: string;
}

const CACHE_STORAGE_KEY = 'br_supabase_logs_cache';

// Load local cache of Supabase logs (fallback)
export function getLocalLogsCache(): SystemLog[] {
  const data = localStorage.getItem(CACHE_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Add a log to the local cache (keeps last 50 logs)
export function saveToLocalLogsCache(log: SystemLog) {
  const cache = getLocalLogsCache();
  const updated = [log, ...cache].slice(0, 50);
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('br_supabase_logs_updated'));
}

// Global logger handler to write to Supabase and keep cache in sync
export async function logSystemEvent(
  category: SystemLog['category'],
  message: string,
  details: string,
  userEmail?: string
) {
  const newLog: SystemLog = {
    category,
    message,
    details,
    user_email: userEmail || 'Anónimo/Sistema',
    created_at: new Date().toISOString()
  };

  // 1. Save to local log history cache first as fallback
  saveToLocalLogsCache(newLog);

  // 2. Add to active Admin Notifications for real-time alerts in UI
  addAdminNotification(category, message, details);

  // 3. Attempt to insert into Supabase
  try {
    const { error } = await supabase
      .from('system_logs')
      .insert([
        {
          category,
          message,
          details,
          user_email: userEmail || 'Anónimo/Sistema'
        }
      ]);

    if (error) {
      console.warn('[Supabase Logger] Falha ao enviar para o Supabase (pode ser necessário criar a tabela):', error.message);
    } else {
      console.log('[Supabase Logger] Log enviado com sucesso para o Supabase.');
    }
  } catch (err) {
    console.error('[Supabase Logger] Erro de rede ao conectar com o Supabase:', err);
  }
}

// Fetch logs from Supabase with error catching
export async function fetchLogsFromSupabase(): Promise<{ logs: SystemLog[]; tableExists: boolean; errorMsg?: string }> {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      // Check if it's a "relation does not exist" database error
      const isMissingTable = 
        error.code === '42P01' || 
        error.message?.toLowerCase().includes('relation') || 
        error.message?.toLowerCase().includes('does not exist');

      return {
        logs: [],
        tableExists: !isMissingTable,
        errorMsg: error.message
      };
    }

    return {
      logs: data as SystemLog[],
      tableExists: true
    };
  } catch (err: any) {
    return {
      logs: [],
      tableExists: false,
      errorMsg: err?.message || 'Erro de ligação ao servidor'
    };
  }
}

// Clear logs on Supabase and locally
export async function clearSupabaseLogs(): Promise<boolean> {
  localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('br_supabase_logs_updated'));
  
  try {
    const { error } = await supabase
      .from('system_logs')
      .delete()
      .neq('category', 'PROTETOR_DE_TABELA_VAZIA'); // Deletes all

    return !error;
  } catch {
    return false;
  }
}

// Listeners initializer
export function initializeSupabaseLogger() {
  if (typeof window === 'undefined') return;

  // Listen to Google Maps API errors dispatched in main.tsx
  window.addEventListener('google-maps-api-error', (e: Event) => {
    const customEvent = e as CustomEvent<{ message: string }>;
    const msg = customEvent.detail?.message || 'Erro indefinido na API do Google Maps';
    
    logSystemEvent(
      'API',
      'Erro na API do Google Maps',
      msg
    );
  });

  // Listen to custom unified logs
  window.addEventListener('baza-rapido-system-log', (e: Event) => {
    const customEvent = e as CustomEvent<{
      category: SystemLog['category'];
      title: string;
      description: string;
      userEmail?: string;
    }>;

    if (customEvent.detail) {
      const { category, title, description, userEmail } = customEvent.detail;
      logSystemEvent(category, title, description, userEmail);
    }
  });

  console.log('[Supabase Logger] Sistema de escuta de eventos ativado.');
}
