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
    agreeToTerms: false,
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

    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            mobile: formData.mobile,
            whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.mobile,
            gender: formData.gender,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        toast.success("Registration successful! Check your email for OTP.");
        
        // Navigate to OTP verification
        navigate("/otp-verification", {
          state: {
            email: formData.email,
            name: formData.fullName,
            password: password,
          },
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md">
        <div className="gold-border bg-card p-8 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground">REGISTRATION</h1>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Full Name *</label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Email Address *</label>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>

          {/* Mobile Number */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Mobile Number *</label>
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>

          {/* Different WhatsApp Number Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.differentWhatsApp}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, differentWhatsApp: checked as boolean })
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label className="text-sm text-foreground">Different WhatsApp number</label>
          </div>

          {/* WhatsApp Number (conditional) */}
          {formData.differentWhatsApp && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">WhatsApp Number</label>
              <Input
                type="tel"
                placeholder="10-digit WhatsApp number"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
              />
            </div>
          )}

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">4-Digit PIN *</label>
            <div className="flex gap-3 justify-between">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`reg-pin-${index}`}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  className="pin-input"
                />
              ))}
            </div>
          </div>

          {/* Gender Toggle */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Gender</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: "male" })}
                className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                  formData.gender === "male"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground border-2 border-muted"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: "female" })}
                className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                  formData.gender === "female"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground border-2 border-muted"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-2">
            <Checkbox
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeToTerms: checked as boolean })
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-1"
            />
            <label className="text-sm text-foreground">
              I agree to the{" "}
              <a href="#" className="text-primary underline">
                Terms & Conditions
              </a>
            </label>
          </div>

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOTP}
            disabled={!formData.agreeToTerms || isLoading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-semibold"
          >
            {isLoading ? "SENDING..." : "SEND OTP"}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>

        {/* WhatsApp FAB */}
        <a
          href="https://wa.me/1234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      </div>
    </div>
  );
}
