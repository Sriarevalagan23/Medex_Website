import { createClient } from '@supabase/supabase-js';
import { MEDexLinks } from './medex';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2dtcnd6enJod3h0Y3R5eGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTI3NzMsImV4cCI6MjA5MjQyODc3M30.pWMGq7XSetuRqjl8Qh2d2Inhjp20L_x7ZIjt6vVMoXk';

const webStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const createSupabaseClient = () =>
  createClient(MEDexLinks.supabaseUrl, SUPABASE_ANON_KEY, {
    auth: {
      storage: webStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

const globalForSupabase = globalThis as typeof globalThis & {
  __medexSupabaseClient?: ReturnType<typeof createSupabaseClient>;
};

export const supabase = globalForSupabase.__medexSupabaseClient ?? createSupabaseClient();

if (typeof window !== 'undefined') {
  globalForSupabase.__medexSupabaseClient = supabase;
}