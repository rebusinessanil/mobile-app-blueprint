import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Hash the email
    const emailHash = await hashEmailManually(email);
    console.log(`Checking if email is blocked: ${email.substring(0, 3)}***`);

    // Check if the hashed email exists in deleted_accounts
    const { data, error } = await adminClient
      .from('deleted_accounts')
      .select('id')
      .eq('email_hash', emailHash)
      .maybeSingle();

    if (error) {
      console.error('Error checking deleted_accounts:', error);
      return new Response(
        JSON.stringify({ blocked: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isBlocked = !!data;
    console.log(`Email blocked status: ${isBlocked}`);

    return new Response(
      JSON.stringify({ blocked: isBlocked }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in check-email-blocked:', error);
    return new Response(
      JSON.stringify({ blocked: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Manual email hashing function (SHA-256) - must match delete-account function
async function hashEmailManually(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
