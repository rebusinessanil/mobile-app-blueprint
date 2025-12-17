import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

interface OTPEmailRequest {
  email: string;
  otp: string;
  name?: string;
}

// Simple in-memory rate limiting (per edge function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 requests per email per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();
  const record = rateLimitMap.get(normalizedEmail);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(normalizedEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Sanitize name to prevent HTML injection
function sanitizeName(name: string | undefined): string {
  if (!name) return "User";
  // Remove HTML tags and limit length
  return name
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, '')
    .substring(0, 50)
    .trim() || "User";
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, name }: OTPEmailRequest = await req.json();
    
    // Input validation
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid OTP format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting check
    if (isRateLimited(email)) {
      console.log(`Rate limit exceeded for email request`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Sanitize name to prevent HTML injection
    const safeName = sanitizeName(name);

    // Use fetch to call Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ReBusiness <onboarding@resend.dev>",
        to: [email],
        subject: "Your ReBusiness Verification Code",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: 'Arial', sans-serif;
                  background: linear-gradient(135deg, #0B0E15 0%, #111827 100%);
                  margin: 0;
                  padding: 20px;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #1a1d2e;
                  border-radius: 24px;
                  padding: 40px;
                  border: 2px solid #FFD34E;
                  box-shadow: 0 10px 40px rgba(255, 211, 78, 0.2);
                }
                .logo {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo h1 {
                  color: #FFD34E;
                  font-size: 32px;
                  margin: 0;
                  font-weight: 700;
                }
                .content {
                  color: #ffffff;
                  line-height: 1.6;
                }
                .greeting {
                  font-size: 20px;
                  margin-bottom: 20px;
                  color: #FFD34E;
                }
                .otp-container {
                  background: linear-gradient(135deg, #FFD34E 0%, #FFC93C 100%);
                  border-radius: 16px;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
                }
                .otp-code {
                  font-size: 48px;
                  font-weight: 700;
                  letter-spacing: 12px;
                  color: #0B0E15;
                  font-family: 'Courier New', monospace;
                }
                .otp-label {
                  color: #0B0E15;
                  font-size: 14px;
                  margin-bottom: 10px;
                  font-weight: 600;
                }
                .info {
                  color: #C7C9CC;
                  font-size: 14px;
                  margin-top: 20px;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #FFD34E;
                  color: #898989;
                  font-size: 12px;
                  text-align: center;
                }
                .warning {
                  background: rgba(255, 77, 79, 0.1);
                  border-left: 4px solid #FF4D4F;
                  padding: 15px;
                  margin: 20px 0;
                  color: #FF4D4F;
                  border-radius: 8px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">
                  <h1>⭐ ReBusiness</h1>
                </div>
                <div class="content">
                  <div class="greeting">
                    Hello ${safeName}! 👋
                  </div>
                  <p>Welcome to ReBusiness! We're excited to have you join our community of business professionals.</p>
                  <p>To complete your registration, please verify your email address using the verification code below:</p>
                  
                  <div class="otp-container">
                    <div class="otp-label">YOUR VERIFICATION CODE</div>
                    <div class="otp-code">${otp}</div>
                  </div>

                  <p class="info">
                    ⏱️ This code will expire in <strong>10 minutes</strong> for security reasons.
                  </p>

                  <div class="warning">
                    <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ReBusiness staff will never ask for your verification code.
                  </div>

                  <p>If you didn't request this code, please ignore this email or contact our support team.</p>
                </div>
                
                <div class="footer">
                  <p><strong>ReBusiness</strong> - Empowering Business Professionals</p>
                  <p>This is an automated email. Please do not reply to this message.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    console.log("OTP email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to send verification email. Please try again." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
