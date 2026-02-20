
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const getEnv = (key: string) => {
  // Try Vite's import.meta.env first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = `VITE_${key.replace('NEXT_PUBLIC_', '')}`;
    if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    if (import.meta.env[key]) return import.meta.env[key];
  }
  // Fallback to process.env if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://kdwkxectaycxdayqzyrf.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkd2t4ZWN0YXljeGRheXF6eXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Njc3MzUsImV4cCI6MjA4NDI0MzczNX0.E30Nm06xpYBVuVdNbVW2RAH67fXbO3kXLW0s45C5Mgg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mtmap-auth-v1',
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'mtmap-fo' }
  },
  db: {
    schema: 'public'
  }
});
