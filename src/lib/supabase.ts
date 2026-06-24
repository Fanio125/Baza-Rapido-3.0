import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pbcoftqdqyitgzwyadjc.supabase.co';
const supabaseAnonKey = 'sb_publishable_H83QVpeK3IBPo10M00QKiQ_Un9XT64L';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    }
  }
});
