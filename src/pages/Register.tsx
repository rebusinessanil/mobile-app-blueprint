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
    emailOrPhone: "",
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

    if (!formData.emailOrPhone.trim()) {
      toast.error("Please enter your email or phone number");
      return;
    }

    // Auto-detect if input is email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrPhone);
    const isPhone = /^\d{10}$/.test(formData.emailOrPhone);

    if (!isEmail && !isPhone) {
      toast.error("Please enter a valid email address or 10-digit phone number");
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
      const pinCode = pin.join("");
      // Use PIN as password for both email and phone
      const password = pinCode;

      if (isEmail) {
        // Email signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.emailOrPhone,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          toast.success("Registration successful! Check your email for OTP.");
          navigate("/otp-verification", {
            state: {
              email: formData.emailOrPhone,
              name: formData.fullName,
              password: password,
            },
          });
        }
      } else {
        // Phone signup
        const { data, error } = await supabase.auth.signUp({
          phone: formData.emailOrPhone,
          password: password,
          options: {
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          toast.success("Registration successful! You can now login.");
          navigate("/login");
        }
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

          {/* Email or Phone */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Email or Phone Number *</label>
            <Input
              type="text"
              placeholder="Enter email or 10-digit phone number"
              value={formData.emailOrPhone}
              onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
              className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
            />
          </div>

          {/* Different WhatsApp */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.differentWhatsApp}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, differentWhatsApp: checked as boolean })
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label className="text-sm text-foreground">Different WhatsApp Number</label>
          </div>

          {/* WhatsApp Number (Optional) */}
          {formData.differentWhatsApp && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">WhatsApp Number</label>
              <Input
                type="tel"
                placeholder="Enter 10-digit WhatsApp number"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12"
              />
            </div>
          )}

          {/* PIN Input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Create 4-Digit PIN *</label>
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

          {/* Gender Selection */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Gender</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-foreground">Male</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-foreground">Female</span>
              </label>
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
              I agree to the <span className="text-primary">Terms & Conditions</span> and{" "}
              <span className="text-primary">Privacy Policy</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSendOTP}
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "REGISTER"}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login Now
            </Link>
          </p>
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
      >
        <MessageCircle className="w-7 h-7 text-white" fill="white" />
      </a>
    </div>
  );
}
