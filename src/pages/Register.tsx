import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, MessageCircle } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
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

  const handleSendOTP = () => {
    // TODO: Implement OTP sending logic
    navigate("/verify-otp");
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
            <div className="flex gap-3">
              <button
                onClick={() => setFormData({ ...formData, gender: "male" })}
                className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                  formData.gender === "male"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground border-2 border-primary"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setFormData({ ...formData, gender: "female" })}
                className={`flex-1 h-12 rounded-xl font-semibold transition-all ${
                  formData.gender === "female"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground border-2 border-primary"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeToTerms: checked as boolean })
              }
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label className="text-sm text-foreground">
              I agree to the{" "}
              <Link to="/terms" className="text-primary underline">
                Terms & Conditions
              </Link>
            </label>
          </div>

          {/* Send OTP Button */}
          <Button
            onClick={handleSendOTP}
            disabled={!formData.agreeToTerms}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50"
          >
            SEND OTP
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