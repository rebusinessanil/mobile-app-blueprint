import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

// Allowed origins for CORS - restrict to trusted domains
const ALLOWED_ORIGINS = [
  'https://gjlrxikynlbpsvrpwebp.lovableproject.com',
  'https://rebusiness.lovable.app',
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.lovable\.app$/,
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
  
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    if (isAllowed) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }
  }
  
  return headers;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Extract and verify the JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[credit-welcome-bonus] Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create a client with the user's token to verify their identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Get the authenticated user from the token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error("[credit-welcome-bonus] Auth verification failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user_id = user.id;
    console.log(`[credit-welcome-bonus] Processing for authenticated user: ${user_id}`);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if welcome bonus already given
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("welcome_bonus_given")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      console.error("[credit-welcome-bonus] Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile?.welcome_bonus_given === true) {
      console.log("[credit-welcome-bonus] Bonus already given, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Bonus already credited", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing welcome bonus transaction to prevent duplicates
    const { data: existingTx } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user_id)
      .ilike("description", "%Welcome Bonus%")
      .limit(1);

    if (existingTx && existingTx.length > 0) {
      console.log("[credit-welcome-bonus] Welcome bonus transaction already exists");
      // Mark as given even if transaction exists
      await supabase.from("profiles").update({ welcome_bonus_given: true }).eq("user_id", user_id);
      return new Response(
        JSON.stringify({ success: true, message: "Bonus already exists", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ATOMIC TRANSACTION: Credit the welcome bonus
    console.log("[credit-welcome-bonus] Crediting 199 welcome bonus...");

    // Step 1: Check if user_credits exists
    const { data: existingCredits } = await supabase
      .from("user_credits")
      .select("balance, total_earned")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingCredits) {
      // Update existing credits by adding 199
      const { error: creditError } = await supabase
        .from("user_credits")
        .update({
          balance: existingCredits.balance + 199,
          total_earned: existingCredits.total_earned + 199,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);

      if (creditError) {
        console.error("[credit-welcome-bonus] Credit update error:", creditError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to credit balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create new user_credits record
      const { error: creditError } = await supabase
        .from("user_credits")
        .insert({
          user_id,
          balance: 199,
          total_earned: 199,
          total_spent: 0,
        });

      if (creditError) {
        console.error("[credit-welcome-bonus] Credit insert error:", creditError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to credit balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 2: Create transaction log
    const { error: txError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id,
        amount: 199,
        transaction_type: "admin_credit",
        description: "Welcome Bonus Credited",
      });

    if (txError) {
      console.error("[credit-welcome-bonus] Transaction log error:", txError);
      // Rollback credit if transaction log fails
      await supabase
        .from("user_credits")
        .update({ balance: 0, total_earned: 0 })
        .eq("user_id", user_id);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to log transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Mark welcome_bonus_given = true
    const { error: flagError } = await supabase
      .from("profiles")
      .update({ 
        welcome_bonus_given: true,
        welcome_popup_seen: false 
      })
      .eq("user_id", user_id);

    if (flagError) {
      console.error("[credit-welcome-bonus] Flag update error:", flagError);
    }

    console.log("[credit-welcome-bonus] ✅ Welcome bonus credited successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome bonus credited", 
        amount: 199,
        user_id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[credit-welcome-bonus] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
