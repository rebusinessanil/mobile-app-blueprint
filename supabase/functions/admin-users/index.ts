import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user is authenticated and is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the is_admin function
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin', { user_id: user.id });
    if (adminError || !isAdmin) {
      console.log('Admin check failed:', adminError, 'isAdmin:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key to access auth.users
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { action, userId, page = 1, perPage = 50 } = await req.json();

    if (action === 'list') {
      // List all users from auth.users with pagination
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
        page: page,
        perPage: perPage,
      });

      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(
          JSON.stringify({ error: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get credits and roles for all users
      const userIds = users.map(u => u.id);
      
      const { data: credits } = await adminClient
        .from('user_credits')
        .select('user_id, balance, total_earned, total_spent')
        .in('user_id', userIds);

      const { data: roles } = await adminClient
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, name, mobile, rank, profile_photo')
        .in('user_id', userIds);

      // Map auth users to combined data structure
      const combinedUsers = users.map(authUser => {
        const credit = credits?.find(c => c.user_id === authUser.id);
        const userRoles = roles?.filter(r => r.user_id === authUser.id) || [];
        const profile = profiles?.find(p => p.user_id === authUser.id);
        
        // Extract provider info
        const providers = authUser.app_metadata?.providers || [];
        const providerType = authUser.app_metadata?.provider || 'email';

        return {
          uid: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || profile?.mobile || '',
          display_name: profile?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
          providers: providers,
          provider_type: providerType,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          // Additional profile data
          rank: profile?.rank || null,
          profile_photo: profile?.profile_photo || null,
          // Credits data
          balance: credit?.balance || 0,
          total_earned: credit?.total_earned || 0,
          total_spent: credit?.total_spent || 0,
          // Role data
          is_admin: userRoles.some(r => r.role === 'admin'),
          roles: userRoles.map(r => r.role),
        };
      });

      console.log(`✅ Fetched ${combinedUsers.length} users from auth`);

      return new Response(
        JSON.stringify({ 
          users: combinedUsers,
          total: users.length,
          page,
          perPage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get' && userId) {
      // Get single user details
      const { data: { user: authUser }, error: getUserError } = await adminClient.auth.admin.getUserById(userId);
      
      if (getUserError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: credit } = await adminClient
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const providers = authUser.app_metadata?.providers || [];
      const providerType = authUser.app_metadata?.provider || 'email';

      return new Response(
        JSON.stringify({
          uid: authUser.id,
          email: authUser.email || '',
          phone: authUser.phone || profile?.mobile || '',
          display_name: profile?.name || authUser.user_metadata?.full_name || '',
          providers,
          provider_type: providerType,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          profile,
          credit,
          roles: userRoles?.map(r => r.role) || [],
          is_admin: userRoles?.some(r => r.role === 'admin') || false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete' && userId) {
      // Delete user from auth (this will cascade to profiles via trigger)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also clean up related data
      await adminClient.from('credit_transactions').delete().eq('user_id', userId);
      await adminClient.from('user_credits').delete().eq('user_id', userId);
      await adminClient.from('user_banner_settings').delete().eq('user_id', userId);
      await adminClient.from('category_banner_settings').delete().eq('user_id', userId);
      await adminClient.from('profile_photos').delete().eq('user_id', userId);
      await adminClient.from('banner_downloads').delete().eq('user_id', userId);
      await adminClient.from('banners').delete().eq('user_id', userId);
      await adminClient.from('trip_achievements').delete().eq('user_id', userId);
      await adminClient.from('user_roles').delete().eq('user_id', userId);
      await adminClient.from('profiles').delete().eq('user_id', userId);

      console.log(`✅ Deleted user ${userId} and all related data`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Admin users function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});