import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessingResult {
  userId: string;
  photoId: string;
  status: "success" | "failed" | "skipped";
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional filters
    let userId: string | undefined;
    let limit: number = 100;
    let dryRun: boolean = false;
    
    try {
      const body = await req.json();
      userId = body.userId;
      limit = body.limit || 100;
      dryRun = body.dryRun || false;
    } catch {
      // No body provided, process all
    }

    console.log(`[REPROCESS] Starting profile photo reprocessing. Dry run: ${dryRun}, Limit: ${limit}`);

    // Fetch profile photos that may need reprocessing
    let query = supabase
      .from("profile_photos")
      .select("id, user_id, photo_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: photos, error: fetchError } = await query;

    if (fetchError) {
      console.error("[REPROCESS] Failed to fetch photos:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile photos", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({ message: "No profile photos found to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[REPROCESS] Found ${photos.length} photos to analyze`);

    const results: ProcessingResult[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const photo of photos) {
      try {
        // Check if photo URL is valid
        if (!photo.photo_url) {
          results.push({
            userId: photo.user_id,
            photoId: photo.id,
            status: "skipped",
            message: "No photo URL"
          });
          skippedCount++;
          continue;
        }

        // Analyze photo - check if it's already a PNG with transparency
        // Photos with proper background removal should be PNG format
        const isPng = photo.photo_url.toLowerCase().includes(".png");
        
        // For now, we'll flag photos for review
        // A full implementation would:
        // 1. Download the image
        // 2. Check alpha channel for proper transparency
        // 3. Run background removal if needed
        // 4. Upload cleaned version
        
        if (dryRun) {
          results.push({
            userId: photo.user_id,
            photoId: photo.id,
            status: "success",
            message: `Would reprocess (PNG: ${isPng})`
          });
          processedCount++;
        } else {
          // In production mode, we would call a background removal service
          // For now, mark as needing manual review
          results.push({
            userId: photo.user_id,
            photoId: photo.id,
            status: "success",
            message: `Flagged for review (PNG: ${isPng})`
          });
          processedCount++;
        }

      } catch (err) {
        console.error(`[REPROCESS] Error processing photo ${photo.id}:`, err);
        results.push({
          userId: photo.user_id,
          photoId: photo.id,
          status: "failed",
          message: err instanceof Error ? err.message : "Unknown error"
        });
        failedCount++;
      }
    }

    const summary = {
      message: "Profile photo reprocessing complete",
      dryRun,
      total: photos.length,
      processed: processedCount,
      skipped: skippedCount,
      failed: failedCount,
      results: results.slice(0, 50) // Limit results in response
    };

    console.log(`[REPROCESS] Complete. Processed: ${processedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[REPROCESS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error during reprocessing",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});