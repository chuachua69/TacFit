import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // PKCE returns the OAuth token as a ?code= query param instead of a #hash
    // fragment. The app uses HashRouter, which owns the hash — implicit flow's
    // #access_token would get clobbered by the router before Supabase reads it.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
