import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BannerRequest {
  templateUrl: string;
  userPhotoUrl: string;
  photoPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputFormat?: 'png' | 'jpeg';
  quality?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { templateUrl, userPhotoUrl, photoPosition, outputFormat = 'png', quality = 100 }: BannerRequest = await req.json();

    console.log('Processing banner with user photo overlay...');

    // Fetch template and user photo
    const [templateResponse, photoResponse] = await Promise.all([
      fetch(templateUrl),
      fetch(userPhotoUrl)
    ]);

    if (!templateResponse.ok || !photoResponse.ok) {
      throw new Error('Failed to fetch images');
    }

    const [templateBuffer, photoBuffer] = await Promise.all([
      templateResponse.arrayBuffer(),
      photoResponse.arrayBuffer()
    ]);

    // Import Sharp dynamically
    const sharp = (await import('https://esm.sh/sharp@0.33.0')).default;

    // Process user photo with Sharp - NO FEATHERING, SHARP EDGES
    const processedPhoto = await sharp(new Uint8Array(photoBuffer))
      .resize(photoPosition.width, photoPosition.height, {
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3', // High-quality resampling for sharp edges
        withoutEnlargement: false
      })
      .sharpen() // Ensure crisp edges
      .toBuffer();

    // Overlay photo on template with precise positioning
    const finalImage = await sharp(new Uint8Array(templateBuffer))
      .composite([{
        input: processedPhoto,
        top: photoPosition.y,
        left: photoPosition.x,
        blend: 'over' // No blending/feathering - clean overlay
      }])
      .toFormat(outputFormat, { 
        quality,
        compressionLevel: outputFormat === 'png' ? 9 : undefined,
        force: true
      })
      .toBuffer();

    // Upload processed image to storage
    const timestamp = Date.now();
    const fileName = `processed-banners/${timestamp}.${outputFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, finalImage, {
        contentType: `image/${outputFormat}`,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName);

    console.log('Banner processed successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        message: 'Banner processed with sharp edges and clean overlay'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing banner:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
