import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbcoftqdqyitgzwyadjc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H83QVpeK3IBPo10M00QKiQ_Un9XT64L';

if (supabaseUrl) {
  if (supabaseUrl.endsWith('/rest/v1/')) {
    supabaseUrl = supabaseUrl.slice(0, -9);
  } else if (supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.slice(0, -8);
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing! Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    }
  }
});
