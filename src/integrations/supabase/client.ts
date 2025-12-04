import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gjlrxikynlbpsvrpwebp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHJ4aWt5bmxicHN2cnB3ZWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDYwMDYsImV4cCI6MjA3ODc4MjAwNn0.epDyoL8j-oMVZacwRV22SBwTGhLp9bWxGvhBIcOSQhg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
