import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

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

interface StoriesSettings {
  preview_hours_before: { hours: number };
  story_duration_hours: { hours: number };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting auto-story generation with story_status logic...');

    // Get settings
    const { data: settings } = await supabase
      .from('stories_settings')
      .select('*');

    const settingsMap: StoriesSettings = {
      preview_hours_before: { hours: 24 },
      story_duration_hours: { hours: 24 }
    };

    settings?.forEach((s: any) => {
      settingsMap[s.setting_key as keyof StoriesSettings] = s.setting_value;
    });

    const durationHours = settingsMap.story_duration_hours.hours;

    // Calculate dates in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split('T')[0];
    const tomorrow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Processing for today: ${today}, tomorrow: ${tomorrow}`);

    // Process events for tomorrow (create preview stories with story_status = false)
    const { data: tomorrowEvents } = await supabase
      .from('stories_events')
      .select('*')
      .eq('event_date', tomorrow)
      .not('story_status', 'is', null); // Only process non-deactivated events

    for (const event of tomorrowEvents || []) {
      // Check if story already exists
      const { data: existing } = await supabase
        .from('stories_generated')
        .select('id')
        .eq('source_type', 'event')
        .eq('source_id', event.id)
        .not('story_status', 'is', null)
        .single();

      if (!existing) {
        const expiresAt = new Date(istNow.getTime() + durationHours * 60 * 60 * 1000);
        
        await supabase.from('stories_generated').insert({
          source_type: 'event',
          source_id: event.id,
          status: 'preview_only',
          story_status: false, // Upcoming
          poster_url: event.poster_url,
          title: `${event.event_type === 'birthday' ? '🎂' : '💞'} ${event.person_name}`,
          event_date: event.event_date,
          expires_at: expiresAt.toISOString(),
        });

        console.log(`Created preview story for event: ${event.person_name} (story_status: false)`);
      }
    }

    // Process festivals for tomorrow (create preview stories with story_status = false)
    const { data: tomorrowFestivals } = await supabase
      .from('stories_festivals')
      .select('*')
      .eq('festival_date', tomorrow)
      .not('story_status', 'is', null); // Only process non-deactivated festivals

    for (const festival of tomorrowFestivals || []) {
      const { data: existing } = await supabase
        .from('stories_generated')
        .select('id')
        .eq('source_type', 'festival')
        .eq('source_id', festival.id)
        .not('story_status', 'is', null)
        .single();

      if (!existing) {
        const expiresAt = new Date(istNow.getTime() + durationHours * 60 * 60 * 1000);
        
        await supabase.from('stories_generated').insert({
          source_type: 'festival',
          source_id: festival.id,
          status: 'preview_only',
          story_status: false, // Upcoming
          poster_url: festival.poster_url,
          title: `🎉 ${festival.festival_name}`,
          event_date: festival.festival_date,
          expires_at: expiresAt.toISOString(),
        });

        console.log(`Created preview story for festival: ${festival.festival_name} (story_status: false)`);
      }
    }

    // Activate stories for today (story_status: false -> true)
    const { data: todayStories } = await supabase
      .from('stories_generated')
      .select('*')
      .eq('event_date', today)
      .eq('story_status', false);

    for (const story of todayStories || []) {
      await supabase
        .from('stories_generated')
        .update({ 
          status: 'active',
          story_status: true // Active
        })
        .eq('id', story.id);

      console.log(`Activated story: ${story.title} (story_status: true)`);
    }

    // Mark expired stories (story_status -> null)
    const { data: expiredStories } = await supabase
      .from('stories_generated')
      .select('id')
      .lte('expires_at', istNow.toISOString())
      .not('story_status', 'is', null);

    for (const story of expiredStories || []) {
      await supabase
        .from('stories_generated')
        .update({ 
          status: 'expired',
          story_status: null // Deactivated/Expired
        })
        .eq('id', story.id);

      console.log(`Marked story as expired: ${story.id} (story_status: null)`);
    }

    // Also update source tables story_status based on date
    // Update stories_events
    await supabase
      .from('stories_events')
      .update({ story_status: true })
      .eq('event_date', today)
      .eq('story_status', false);

    await supabase
      .from('stories_events')
      .update({ story_status: null })
      .lt('event_date', today)
      .not('story_status', 'is', null);

    // Update stories_festivals
    await supabase
      .from('stories_festivals')
      .update({ story_status: true })
      .eq('festival_date', today)
      .eq('story_status', false);

    await supabase
      .from('stories_festivals')
      .update({ story_status: null })
      .lt('festival_date', today)
      .not('story_status', 'is', null);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-story generation completed with story_status logic',
        stats: {
          tomorrowEvents: tomorrowEvents?.length || 0,
          tomorrowFestivals: tomorrowFestivals?.length || 0,
          activatedToday: todayStories?.length || 0,
          expired: expiredStories?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-story generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
