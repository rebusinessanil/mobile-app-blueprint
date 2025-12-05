import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requester is admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { user_id: adminUser.id });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, target_user_id, new_pin } = await req.json();
    
    console.log(`[admin-pin-management] Admin ${adminUser.id} performing ${action} on user ${target_user_id}`);

    if (action === "check_pin_status") {
      // Get user data including metadata where PIN is stored
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(target_user_id);
      
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has logged in (which means they have a password/PIN)
      const hasPinSet = userData.user.last_sign_in_at !== null || 
                        userData.user.created_at !== userData.user.updated_at;

      // Get the stored plain PIN from user_metadata (if admin has set it)
      const storedPin = userData.user.user_metadata?.admin_set_pin || null;

      return new Response(
        JSON.stringify({ 
          success: true, 
          has_pin: hasPinSet,
          user_id: target_user_id,
          // Return actual PIN if stored in metadata by admin
          plain_pin: storedPin
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset_pin") {
      if (!new_pin || new_pin.length !== 4 || !/^\d{4}$/.test(new_pin)) {
        return new Response(
          JSON.stringify({ success: false, error: "PIN must be exactly 4 digits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset user's PIN (stored as password with prefix)
      const paddedPin = `pin_${new_pin}`;
      
      // Get existing user metadata first
      const { data: existingUser } = await supabase.auth.admin.getUserById(target_user_id);
      const existingMetadata = existingUser?.user?.user_metadata || {};
      
      // Update password AND store plain PIN in user_metadata for admin viewing
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        target_user_id,
        { 
          password: paddedPin,
          user_metadata: {
            ...existingMetadata,
            admin_set_pin: new_pin // Store plain PIN for admin viewing
          }
        }
      );

      if (updateError) {
        console.error("[admin-pin-management] PIN reset error:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to reset PIN" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[admin-pin-management] ✅ PIN reset successfully for user ${target_user_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "PIN reset successfully",
          user_id: target_user_id,
          plain_pin: new_pin // Return the new PIN
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[admin-pin-management] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
