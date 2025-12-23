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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client - for getting the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client - for deleting user and accessing auth.users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log(`Processing account deletion for user: ${userId}, email: ${userEmail}`);

    // Step 1: Hash the email and store in deleted_accounts
    if (userEmail) {
      const { error: hashError } = await adminClient.rpc('hash_email', { email: userEmail });
      if (hashError) {
        console.log('Note: hash_email function call (for testing):', hashError.message);
      }

      // Insert the hashed email into deleted_accounts
      const { error: insertError } = await adminClient
        .from('deleted_accounts')
        .insert({
          email_hash: await hashEmailManually(userEmail)
        });
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('Failed to insert into deleted_accounts:', insertError);
        // Continue anyway - we want to delete the account
      } else {
        console.log('Email hash stored in deleted_accounts');
      }
    }

    // Step 2: Delete all user data from related tables
    const tablesToDelete = [
      'profile_photos',
      'user_banner_settings',
      'category_banner_settings',
      'banner_downloads',
      'credit_transactions',
      'user_credits',
      'trip_achievements',
      'banner_stickers',
      'banners',
      'profiles'
    ];

    for (const table of tablesToDelete) {
      try {
        const { error } = await adminClient
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (error) {
          console.log(`Note: Could not delete from ${table}:`, error.message);
        } else {
          console.log(`Deleted data from ${table}`);
        }
      } catch (e) {
        console.log(`Table ${table} deletion skipped:`, e);
      }
    }

    // Step 3: Delete user roles
    try {
      const { error: rolesError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (rolesError) {
        console.log('Note: Could not delete user_roles:', rolesError.message);
      } else {
        console.log('Deleted user roles');
      }
    } catch (e) {
      console.log('User roles deletion skipped:', e);
    }

    // Step 4: Delete user from auth.users using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete user from auth:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account permanently deleted' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in delete-account:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Manual email hashing function (SHA-256)
async function hashEmailManually(email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
