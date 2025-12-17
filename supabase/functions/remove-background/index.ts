import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// MODNet model URL - lightweight portrait matting model (~5MB)
const MODEL_URL = "https://huggingface.co/nicknijenhuis/modnet-onnx/resolve/main/modnet.onnx";

let modelSession: any = null;
let ort: any = null;

// Lazy load ONNX runtime
async function getOrt() {
  if (!ort) {
    ort = await import("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/esm/ort.all.min.mjs");
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/";
  }
  return ort;
}

// Load model once and cache
async function getModelSession() {
  if (modelSession) return modelSession;
  
  const ortLib = await getOrt();
  
  console.log("Loading MODNet model...");
  const modelResponse = await fetch(MODEL_URL);
  const modelBuffer = await modelResponse.arrayBuffer();
  
  modelSession = await ortLib.InferenceSession.create(new Uint8Array(modelBuffer), {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  
  console.log("MODNet model loaded successfully");
  return modelSession;
}

// Decode base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encode Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Simple image decoder using canvas-like approach
async function decodeImage(imageData: Uint8Array): Promise<{ width: number; height: number; data: Uint8Array }> {
  // Use ImageMagick or similar via Deno - for now use a simpler approach
  // We'll use the browser's native image decoding via a data URL approach
  
  // Since we're in Deno, we need to use a different approach
  // Import sharp-like functionality or use built-in image processing
  
  // For edge function, we'll process using raw pixel manipulation
  // This is a simplified version - in production you'd want proper image decoding
  
  return { width: 512, height: 512, data: imageData };
}

// Preprocess image for MODNet (512x512, normalized)
function preprocessImage(imageData: Uint8Array, width: number, height: number): Float32Array {
  const targetSize = 512;
  const tensor = new Float32Array(3 * targetSize * targetSize);
  
  // Simple resize and normalize
  const scaleX = width / targetSize;
  const scaleY = height / targetSize;
  
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = y * targetSize + x;
      
      // Normalize to [0, 1] and apply ImageNet normalization
      const r = (imageData[srcIdx] / 255 - 0.485) / 0.229;
      const g = (imageData[srcIdx + 1] / 255 - 0.456) / 0.224;
      const b = (imageData[srcIdx + 2] / 255 - 0.406) / 0.225;
      
      tensor[dstIdx] = r;
      tensor[targetSize * targetSize + dstIdx] = g;
      tensor[2 * targetSize * targetSize + dstIdx] = b;
    }
  }
  
  return tensor;
}

// Apply alpha mask to original image
function applyMask(
  imageData: Uint8Array, 
  mask: Float32Array, 
  width: number, 
  height: number,
  maskWidth: number,
  maskHeight: number
): Uint8Array {
  const result = new Uint8Array(width * height * 4);
  const scaleX = maskWidth / width;
  const scaleY = maskHeight / height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const maskX = Math.floor(x * scaleX);
      const maskY = Math.floor(y * scaleY);
      const maskIdx = maskY * maskWidth + maskX;
      
      const alpha = Math.round(mask[maskIdx] * 255);
      
      result[srcIdx] = imageData[srcIdx];
      result[srcIdx + 1] = imageData[srcIdx + 1];
      result[srcIdx + 2] = imageData[srcIdx + 2];
      result[srcIdx + 3] = alpha;
    }
  }
  
  return result;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { imageBase64, width, height, imageData } = await req.json();
    
    if (!imageData || !width || !height) {
      throw new Error('Missing required fields: imageData, width, height');
    }
    
    console.log(`Processing image: ${width}x${height}`);
    
    // Get model session (cached after first load)
    const session = await getModelSession();
    const ortLib = await getOrt();
    
    // Convert image data from array to Uint8Array
    const pixels = new Uint8Array(imageData);
    
    // Preprocess for MODNet
    const inputTensor = preprocessImage(pixels, width, height);
    
    // Create ONNX tensor
    const tensor = new ortLib.Tensor('float32', inputTensor, [1, 3, 512, 512]);
    
    // Run inference
    const inferenceStart = Date.now();
    const results = await session.run({ input: tensor });
    console.log(`Inference time: ${Date.now() - inferenceStart}ms`);
    
    // Get output mask
    const outputData = results.output.data as Float32Array;
    
    // Apply mask to original image
    const resultPixels = applyMask(pixels, outputData, width, height, 512, 512);
    
    // Encode result as PNG using simple approach
    // For production, use a proper PNG encoder
    const resultBase64 = uint8ArrayToBase64(resultPixels);
    
    const totalTime = Date.now() - startTime;
    console.log(`Total processing time: ${totalTime}ms`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        resultData: Array.from(resultPixels),
        width,
        height,
        processingTime: totalTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Background removal error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
