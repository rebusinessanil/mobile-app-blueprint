import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Zod validation schema for login
const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d{4}$/, "PIN must contain only numbers")
});

export default function Login() {
  const navigate = useNavigate();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < 3) {
        document.getElementById(`pin-${index + 1}`)?.focus();
      }
    }
  };
  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };
  // PIN prefix to meet Supabase 6-character minimum password requirement
  const PIN_PREFIX = "pin_";
  const handleLogin = async () => {
    const pinString = pin.join("");

    // Zod validation for inputs
    const validationResult = loginSchema.safeParse({
      email: emailOrMobile,
      pin: pinString
    });
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    setLoading(true);
    try {
      // Pad PIN with prefix to match saved password format
      const paddedPassword = PIN_PREFIX + pinString;

      // Sign in with email and padded PIN as password
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: emailOrMobile.trim(),
        password: paddedPassword
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or PIN. Please try again.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.user) {
        toast.success("Login successful!");
        // Full access - redirect directly to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      // Security: Don't log sensitive login data
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
      // Don't setGoogleLoading(false) here - we're redirecting
    } catch (error) {
      toast.error("An unexpected error occurred");
      setGoogleLoading(false);
    }
  };
  return <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="gold-border bg-card p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground">LOGIN</h1>

          {/* Email/Mobile Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Email / Mobile</label>
            <Input type="text" placeholder="Enter email or mobile number" value={emailOrMobile} onChange={e => setEmailOrMobile(e.target.value)} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12" />
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">4-Digit PIN</label>
            <div className="flex gap-3 justify-between">
              {pin.map((digit, index) => <input key={index} id={`pin-${index}`} type="password" maxLength={1} value={digit} onChange={e => handlePinChange(index, e.target.value)} onKeyDown={e => handlePinKeyDown(index, e)} className="pin-input" />)}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
              <label className="text-sm text-foreground">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Continue with Google */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-12 border-border bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Login Button */}
          <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50">
            {loading ? "Logging in..." : "LOGIN"}
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Sign Up Now
            </Link>
          </p>
        </div>
      </div>

      {/* WhatsApp FAB - Always visible on login page, cannot be closed */}
      
    </div>;
}