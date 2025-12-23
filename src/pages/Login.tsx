import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useSupabaseConnection } from "@/hooks/useSupabaseConnection";
import LockedDashboardPreview from "@/components/LockedDashboardPreview";
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
  const { withConnectionCheck, isChecking } = useSupabaseConnection();

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

    const paddedPassword = PIN_PREFIX + pinString;

    const result = await withConnectionCheck(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrMobile.trim(),
        password: paddedPassword
      });

      if (error) {
        throw error;
      }

      return data;
    }, { showToast: true, retryOnFail: true });

    if (result.success && result.data?.user) {
      // Set bypass flag to skip profile completion checks
      try {
        localStorage.setItem("rebusiness_profile_completed", "true");
      } catch {}
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Locked Dashboard Preview Background */}
      <LockedDashboardPreview />
      
      {/* Login Form - Foreground with transparency */}
      <div className="w-full max-w-md relative z-10">
        <div className="gold-border bg-card/80 backdrop-blur-md p-8 space-y-6 shadow-2xl">
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
          

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
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
    </div>
  );
}