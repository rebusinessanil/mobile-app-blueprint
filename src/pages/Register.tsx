import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    differentWhatsApp: false,
    whatsappNumber: "",
    gender: "male",
    agreeToTerms: false
  });
  const [pin, setPin] = useState(["", "", "", ""]);
  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      if (value && index < 3) {
        document.getElementById(`reg-pin-${index + 1}`)?.focus();
      }
    }
  };
  const handleSendOTP = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate mobile number (E.164 format support)
    // Must start with + and contain 10-15 digits
    const mobileNumber = formData.mobile.trim();
    if (!mobileNumber) {
      toast.error("Mobile number is required");
      return;
    }

    // E.164 format validation: +[country code][number] (10-15 digits total)
    const e164Pattern = /^\+[1-9]\d{9,14}$/;

    // Also support plain 10-digit numbers (will be converted to E.164)
    const plainPattern = /^\d{10}$/;
    let formattedMobile = mobileNumber;
    if (e164Pattern.test(mobileNumber)) {
      // Already in E.164 format
      formattedMobile = mobileNumber;
    } else if (plainPattern.test(mobileNumber)) {
      // Convert 10-digit to E.164 format with default country code +91 (India)
      formattedMobile = `+91${mobileNumber}`;
    } else {
      toast.error("Please enter a valid mobile number (10 digits or +[country code][number])");
      return;
    }
    const pinCode = pin.join("");
    if (pinCode.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }
    setIsLoading(true);
    try {
      // Create password from PIN (you may want to add more complexity)
      const password = `ReBiz${pinCode}${Date.now()}`;

      // Sign up with Supabase
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        phone: formattedMobile,
        // Store phone in auth.users table for Supabase dashboard
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            mobile: formattedMobile,
            // Store in E.164 format
            whatsapp: formData.differentWhatsApp ? formData.whatsappNumber.startsWith('+') ? formData.whatsappNumber : `+91${formData.whatsappNumber}` : formattedMobile,
            gender: formData.gender
          }
        }
      });
      if (error) throw error;
      if (data?.user) {
        toast.success("Registration successful! Check your email for OTP.");

        // Navigate to OTP verification
        navigate("/otp-verification", {
          state: {
            email: formData.email,
            name: formData.fullName,
            password: password
          }
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="h-screen bg-navy-dark flex items-center justify-center p-3 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="gold-border bg-card p-4 space-y-3">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground">REGISTRATION</h1>

          {/* Continue with Google */}
          <Button type="button" onClick={async () => {
          try {
            const {
              error
            } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/dashboard`
              }
            });
            if (error) throw error;
          } catch (error: any) {
            toast.error(error.message || "Google sign-in failed");
          }
        }} className="w-full h-10 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium flex items-center justify-center gap-2 text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs text-foreground">Full Name *</label>
            <Input type="text" placeholder="Enter your full name" value={formData.fullName} onChange={e => setFormData({
            ...formData,
            fullName: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-10 text-sm" />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs text-foreground">Email Address *</label>
            <Input type="email" placeholder="your.email@example.com" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-10 text-sm" />
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="text-xs text-foreground">Mobile Number *</label>
            <Input type="tel" placeholder="+91XXXXXXXXXX or 10-digit number" value={formData.mobile} onChange={e => setFormData({
            ...formData,
            mobile: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-10 text-sm" required />
          </div>

          {/* Different WhatsApp Number Checkbox */}
          

          {/* WhatsApp Number (conditional) */}
          {formData.differentWhatsApp && <div className="space-y-1">
              <label className="text-xs text-foreground">WhatsApp Number</label>
              <Input type="tel" placeholder="10-digit WhatsApp number" value={formData.whatsappNumber} onChange={e => setFormData({
            ...formData,
            whatsappNumber: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-10 text-sm" />
            </div>}

          {/* PIN Input */}
          <div className="space-y-1">
            <label className="text-xs text-foreground">Create 4-Digit PIN *</label>
            <div className="flex gap-2 justify-between">
              {pin.map((digit, index) => <input key={index} id={`reg-pin-${index}`} type="password" maxLength={1} value={digit} onChange={e => handlePinChange(index, e.target.value)} className="pin-input w-12 h-10 text-center" />)}
            </div>
          </div>

          {/* Gender Toggle */}
          

          {/* Terms & Conditions */}
          <div className="flex items-center gap-2">
            <Checkbox checked={formData.agreeToTerms} onCheckedChange={checked => setFormData({
            ...formData,
            agreeToTerms: checked as boolean
          })} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4" />
            <label className="text-xs text-foreground">
              I agree to the{" "}
              <a href="#" className="text-primary underline">
                Terms & Conditions
              </a>
            </label>
          </div>

          {/* Send OTP Button */}
          <Button onClick={handleSendOTP} disabled={!formData.agreeToTerms || isLoading} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold">
            {isLoading ? "SENDING..." : "SEND OTP"}
          </Button>

          {/* Login Link */}
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>

        {/* WhatsApp FAB */}
        <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50">
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      </div>
    </div>;
}