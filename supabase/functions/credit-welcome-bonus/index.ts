import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

// Allowed origins for CORS - restrict to trusted domains
const ALLOWED_ORIGINS = [
  "https://gjlrxikynlbpsvrpwebp.lovableproject.com",
  "https://rebusiness.lovable.app",
  "https://rebusiness.in",
  "https://www.rebusiness.in",
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*rebusiness\.in$/,
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      if (typeof allowed === "string") return allowed === origin;
      return allowed.test(origin);
    });

    if (isAllowed) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Vary"] = "Origin";
    }
  }

  return headers;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[credit-welcome-bonus] Missing/invalid Authorization header");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);

    // Verify token -> get user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("[credit-welcome-bonus] JWT verification failed:", authError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = user.id;
    console.log(`[credit-welcome-bonus] Start user_id=${user_id}`);

    // Service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Idempotency: if a welcome bonus transaction exists, consider credited.
    const { data: existingTx, error: existingTxError } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user_id)
      .ilike("description", "%Welcome Bonus%")
      .limit(1);

    if (existingTxError) {
      console.error("[credit-welcome-bonus] Existing TX lookup failed:", existingTxError);
      return new Response(JSON.stringify({ success: false, error: "Failed to verify bonus state" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingTx && existingTx.length > 0) {
      // Keep flags consistent (best-effort)
      await supabase
        .from("profiles")
        .update({ welcome_bonus_given: true })
        .eq("user_id", user_id);

      return new Response(
        JSON.stringify({ success: true, skipped: true, message: "Welcome bonus already credited" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Credit logic: add 199 to existing balance (or create new).
    const BONUS = 199;

    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance, total_earned, total_spent")
      .eq("user_id", user_id)
      .maybeSingle();

    if (creditsError) {
      console.error("[credit-welcome-bonus] Credits fetch error:", creditsError);
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentBalance = credits?.balance ?? 0;
    const currentEarned = credits?.total_earned ?? 0;
    const currentSpent = credits?.total_spent ?? 0;

    const newBalance = currentBalance + BONUS;
    const newTotalEarned = currentEarned + BONUS;

    const { error: upsertError } = await supabase
      .from("user_credits")
      .upsert(
        {
          user_id,
          balance: newBalance,
          total_earned: newTotalEarned,
          total_spent: currentSpent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[credit-welcome-bonus] Credits upsert error:", upsertError);
      return new Response(JSON.stringify({ success: false, error: "Failed to credit wallet" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Log transaction
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id,
      amount: BONUS,
      transaction_type: "admin_credit",
      description: "Welcome Bonus Credited",
    });

    if (txError) {
      console.error("[credit-welcome-bonus] Transaction insert error:", txError);
      // Best effort rollback: revert the credited amount
      await supabase
        .from("user_credits")
        .upsert(
          {
            user_id,
            balance: currentBalance,
            total_earned: currentEarned,
            total_spent: currentSpent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      return new Response(JSON.stringify({ success: false, error: "Failed to log transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4) Update flags (welcome_popup_seen must remain false so popup can show once)
    // Note: profile row may not exist yet, so treat as best-effort.
    const { error: flagsError } = await supabase
      .from("profiles")
      .update({ welcome_bonus_given: true, welcome_popup_seen: false })
      .eq("user_id", user_id);

    if (flagsError) {
      console.warn("[credit-welcome-bonus] Flags update failed (non-blocking):", flagsError);
    }

    console.log(`[credit-welcome-bonus] ✅ Credited bonus=${BONUS} newBalance=${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        amount: BONUS,
        previous_balance: currentBalance,
        new_balance: newBalance,
        user_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[credit-welcome-bonus] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
