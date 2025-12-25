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
import LiveActivityTicker from "@/components/LiveActivityTicker";
import FloatingParticles from "@/components/FloatingParticles";
import WhatsAppDiscovery from "@/components/WhatsAppDiscovery";

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

  // Show full-screen gold coin animation during login
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #0a1f1a 0%, #030a08 50%, #000000 100%)' }}>
        {/* Floating Particles */}
        <FloatingParticles />
        
        {/* Gold Coin Spinning Animation */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Outer Glow Ring */}
            <motion.div
              className="absolute inset-[-20px] rounded-full bg-gradient-to-r from-primary/40 via-yellow-400/40 to-primary/40 blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Spinning Coin Container */}
            <motion.div
              className="w-24 h-24 relative"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                className="w-full h-full relative"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: 360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {/* Coin Front */}
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-primary to-amber-600 flex items-center justify-center shadow-2xl border-4 border-yellow-400/50"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-4xl">💰</div>
                  {/* Inner ring detail */}
                  <div className="absolute inset-2 rounded-full border-2 border-yellow-200/30" />
                </div>
                
                {/* Coin Back */}
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 via-primary to-yellow-300 flex items-center justify-center shadow-2xl border-4 border-yellow-400/50"
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)"
                  }}
                >
                  <div className="text-4xl">⭐</div>
                  {/* Inner ring detail */}
                  <div className="absolute inset-2 rounded-full border-2 border-yellow-200/30" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
          
          {/* Loading Text */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.p 
              className="text-lg font-bold login-shimmer-text"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Unlocking Your Account...
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1">Please wait</p>
          </motion.div>
        </div>
      </div>
    );
  }

  const isUnlocked = emailOrMobile.length > 0;

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at center, #0a1f1a 0%, #030a08 50%, #000000 100%)' }}
    >
      {/* Grain Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Subtle Emerald Glow Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-950/40 rounded-full blur-[180px]" />
      <div className="absolute top-[40%] right-[5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[120px]" />
      
      {/* Dynamic Island Ticker at Top */}
      <LiveActivityTicker />
      
      {/* WhatsApp Discovery Button */}
      <WhatsAppDiscovery />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          className="royal-card p-8 space-y-6"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Smart Lock Icon - Reacts to input */}
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-primary via-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30"
              animate={isUnlocked ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AnimatePresence mode="wait">
                {isUnlocked ? (
                  <motion.div
                    key="unlocked"
                    initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <LockOpen className="w-8 h-8 text-black" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <Lock className="w-8 h-8 text-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Serif Gold Gradient Title */}
          <h1 className="text-4xl text-center royal-heading tracking-wide">LOGIN</h1>

          {/* Email/Mobile Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">Email / Mobile</label>
            <Input 
              type="text" 
              placeholder="Enter email or mobile number" 
              value={emailOrMobile} 
              onChange={e => setEmailOrMobile(e.target.value)} 
              className="royal-input" 
            />
          </div>

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground/80">4-Digit PIN</label>
            <div className="flex gap-3 justify-between">
              {pin.map((digit, index) => (
                <input 
                  key={index} 
                  id={`pin-${index}`} 
                  type="password" 
                  maxLength={1} 
                  value={digit} 
                  onChange={e => handlePinChange(index, e.target.value)} 
                  onKeyDown={e => handlePinKeyDown(index, e)} 
                  className="pin-input" 
                />
              ))}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={rememberMe} 
                onCheckedChange={checked => setRememberMe(checked as boolean)} 
                className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" 
              />
              <label className="text-sm text-foreground/80">Remember Me</label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Forgot Password?
            </Link>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
          </div>

          {/* Login Button - Metallic Gold */}
          <Button 
            onClick={handleLogin} 
            disabled={loading} 
            className="w-full h-12 metallic-gold-btn text-base rounded-xl disabled:opacity-50 border-0"
          >
            LOGIN
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-foreground/70">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign Up Now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
