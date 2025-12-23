import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseConnection } from "@/hooks/useSupabaseConnection";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkConnection, isConnected } = useSupabaseConnection();
  const email = location.state?.email;
  const name = location.state?.name;
  const mobile = location.state?.mobile;
  const pin = location.state?.pin;
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error("No email provided");
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    // Check connection before verifying
    const connectionOk = await checkConnection();
    if (!connectionOk) {
      toast.error("Server not reachable. Please check your internet connection and try again.");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email!,
        token: otpCode,
        type: "signup",
      });

      if (error) throw error;

      if (data?.user && data?.session) {
        // Credit welcome bonus via edge function (idempotent)
        try {
          const response = await fetch(
            'https://gjlrxikynlbpsvrpwebp.supabase.co/functions/v1/credit-welcome-bonus',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`,
              },
            }
          );
          const bonusResult = await response.json();
          console.log('[Welcome Bonus]', bonusResult);
        } catch (bonusError) {
          // Don't block onboarding; wallet will still work without bonus
          console.error('Welcome bonus error:', bonusError);
        }

        // Check if profile is already complete (returning user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('user_id', data.user.id)
          .single();
        
        toast.success("Email verified successfully!");
        
        if (profileData?.profile_completed) {
          // Existing user with complete profile - go to dashboard
          navigate("/dashboard", { replace: true });
        } else {
          // New user or incomplete profile - go to profile-edit with prefilled data
          navigate("/profile-edit", { 
            replace: true,
            state: {
              prefillName: name,
              prefillEmail: email,
              prefillMobile: mobile,
              prefillPin: pin
            }
          });
        }
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        toast.error("Server not reachable. Please check your internet connection and try again.");
      } else {
        toast.error(error.message || "Invalid verification code");
      }
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    // Check connection before resending
    const connectionOk = await checkConnection();
    if (!connectionOk) {
      toast.error("Server not reachable. Please check your internet connection and try again.");
      return;
    }

    setIsResending(true);

    try {
      // Resend OTP via Supabase
      const { error } = await supabase.auth.signUp({
        email: email!,
        password: location.state?.password || crypto.randomUUID(), // Use stored password or generate random
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success("Verification code resent to your email!");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      if (error.message?.includes("fetch") || error.message?.includes("network")) {
        toast.error("Server not reachable. Please check your internet connection and try again.");
      } else {
        toast.error(error.message || "Failed to resend code");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark to-navy flex items-center justify-center p-4 sm:p-6 safe-area-top safe-area-bottom">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-destructive/90 text-white rounded-full text-sm animate-pulse">
          <WifiOff className="w-4 h-4" />
          <span>No connection</span>
        </div>
      )}
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/register")}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Registration</span>
        </button>

        {/* Main card */}
        <div className="gold-border bg-card/95 backdrop-blur-sm p-8 rounded-3xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Verify Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-primary font-semibold">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="space-y-4">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold gold-border bg-background/50 focus:bg-background"
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </Button>
          </div>

          {/* Resend OTP */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            {canResend ? (
              <Button
                onClick={handleResendOTP}
                disabled={isResending}
                variant="ghost"
                className="text-primary hover:text-primary/90 font-semibold"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="text-primary font-semibold">{countdown}s</span>
              </p>
            )}
          </div>

          {/* Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              ⏱️ The verification code expires in 10 minutes
            </p>
            <p className="text-xs text-muted-foreground text-center">
              🔒 Never share your verification code with anyone
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
