import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, LockOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useSupabaseConnection } from "@/hooks/useSupabaseConnection";
import { getUserRoleAndRedirect } from "@/hooks/useUserRole";

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
      
      // Check user role and redirect accordingly
      const { redirectPath, isAdmin } = await getUserRoleAndRedirect(result.data.user.id);
      
      toast.success(isAdmin ? "Welcome back, Admin!" : "Login successful!");
      navigate(redirectPath, { replace: true });
    }

    setLoading(false);
  };
  return <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center p-6">
      {/* Aurora/Mesh Gradient Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full opacity-40 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600 rounded-full opacity-50 blur-[150px]" />
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-blue-800 rounded-full opacity-60 blur-[100px]" />
      <div className="absolute bottom-[20%] left-[5%] w-[35%] h-[35%] bg-violet-500 rounded-full opacity-30 blur-[130px]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="gold-border bg-card p-8 space-y-6">
          {/* Animated Lock Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="locked"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Lock className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <LockOpen className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Animated Shimmer Title */}
          <h1 className="text-3xl font-bold text-center login-shimmer-text">LOGIN</h1>

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

      {/* WhatsApp FAB - Always visible on login page, cannot be closed */}
      
    </div>;
}