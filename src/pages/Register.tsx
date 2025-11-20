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
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<"pin" | "otp">("pin");
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    emailOrPhone: "",
    differentWhatsApp: false,
    whatsappNumber: "",
    gender: "male",
    agreeToTerms: false
  });
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: ""
  });
  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      if (isConfirm) {
        const newConfirmPin = [...confirmPin];
        newConfirmPin[index] = value;
        setConfirmPin(newConfirmPin);
        if (value && index < 3) {
          document.getElementById(`reg-confirm-pin-${index + 1}`)?.focus();
        }
      } else {
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        if (value && index < 3) {
          document.getElementById(`reg-pin-${index + 1}`)?.focus();
        }
      }
    }
  };
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };
  const handleSendOTPForRegistration = async () => {
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
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }
    setIsLoading(true);
    try {
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Generate a temporary password for OTP-only registration
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      if (isEmail) {
        // Sign up the user
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email: formData.emailOrPhone,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender
            }
          }
        });
        if (error) throw error;
        
        if (data?.user) {
          // Send custom formatted OTP email using our edge function
          const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
            body: {
              email: formData.emailOrPhone,
              otp: generatedOtp,
              name: formData.fullName
            }
          });
          
          if (emailError) {
            console.error("Failed to send OTP email:", emailError);
            toast.error("Failed to send OTP email. Please try again.");
            return;
          }
          
          setUserCredentials({
            email: formData.emailOrPhone,
            password: tempPassword
          });
          setOtpSent(true);
          toast.success("A 6-digit OTP has been sent to your email! Check your inbox.");
        }
      } else {
        // Phone signup - Supabase sends SMS OTP automatically
        const {
          data,
          error
        } = await supabase.auth.signUp({
          phone: formData.emailOrPhone,
          password: tempPassword,
          options: {
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender
            }
          }
        });
        if (error) throw error;
        if (data?.user) {
          setUserCredentials({
            email: formData.emailOrPhone,
            password: tempPassword
          });
          setOtpSent(true);
          toast.success("A 6-digit OTP has been sent to your phone!");
        }
      }
    } catch (error: any) {
      console.error("OTP send error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegisterWithPIN = async () => {
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
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    const confirmPinCode = confirmPin.join("");
    if (confirmPinCode.length !== 4) {
      toast.error("Please confirm your 4-digit PIN");
      return;
    }
    if (pinCode !== confirmPinCode) {
      toast.error("PINs do not match. Please try again.");
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }
    setIsLoading(true);
    try {
      const pinCode = pin.join("");
      // Generate a 6-digit OTP for email verification
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Transform 4-digit PIN to meet Supabase 6-char minimum while keeping user experience simple
      const password = `PIN${pinCode}XX`;
      
      if (isEmail) {
        // Email signup
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email: formData.emailOrPhone,
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender
            }
          }
        });
        if (error) throw error;
        
        if (data?.user) {
          // Send custom formatted OTP email using our edge function
          const { error: emailError } = await supabase.functions.invoke('send-otp-email', {
            body: {
              email: formData.emailOrPhone,
              otp: generatedOtp,
              name: formData.fullName
            }
          });
          
          if (emailError) {
            console.error("Failed to send OTP email:", emailError);
            toast.error("Failed to send OTP email. Please try again.");
            return;
          }
          
          // Store credentials for OTP verification
          setUserCredentials({
            email: formData.emailOrPhone,
            password: password
          });
          setShowOtpVerification(true);
          toast.success("A 6-digit OTP has been sent to your email! Check your inbox and enter the code to verify.");
        }
      } else {
        // Phone signup - Supabase sends SMS OTP automatically
        const {
          data,
          error
        } = await supabase.auth.signUp({
          phone: formData.emailOrPhone,
          password: password,
          options: {
            data: {
              full_name: formData.fullName,
              whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : formData.emailOrPhone,
              gender: formData.gender
            }
          }
        });
        if (error) throw error;
        if (data?.user) {
          // Store credentials for OTP verification
          setUserCredentials({
            email: formData.emailOrPhone,
            password: password
          });
          setShowOtpVerification(true);
          toast.success("A 6-digit OTP has been sent to your phone. Please verify to complete registration.");
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleVerifyOTPForRegistration = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userCredentials.email);
      const {
        data,
        error
      } = await supabase.auth.verifyOtp(isEmail ? {
        email: userCredentials.email,
        token: otpCode,
        type: 'signup'
      } : {
        phone: userCredentials.email,
        token: otpCode,
        type: 'sms'
      });
      if (error) {
        toast.error("Invalid OTP. Please check and try again.");
        return;
      }
      if (data.user) {
        // Create profile record after successful OTP verification
        const {
          error: profileError
        } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          name: formData.fullName,
          mobile: !isEmail ? userCredentials.email : null,
          whatsapp: formData.differentWhatsApp ? formData.whatsappNumber : userCredentials.email
        });
        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
        toast.success("Account verified successfully! You can now log in.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Verification Screen (for PIN-based registration)
  if (showOtpVerification) {
    return <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="gold-border bg-card p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">VERIFY OTP</h1>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit OTP sent to {userCredentials.email}
              </p>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm text-foreground">6-Digit OTP</label>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => <input key={index} id={`otp-${index}`} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(index, e.target.value)} className="pin-input" />)}
              </div>
            </div>

            {/* Verify Button */}
            <Button onClick={handleVerifyOTPForRegistration} disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50">
              {isLoading ? "Verifying..." : "VERIFY OTP"}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <button onClick={() => {
              setShowOtpVerification(false);
              setOtp(["", "", "", "", "", ""]);
            }} className="text-sm text-primary hover:underline">
                Back to Registration
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp FAB */}
        <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
          <MessageCircle className="w-7 h-7 text-white" fill="white" />
        </a>
      </div>;
  }
  return <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6 py-12">
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
            <Input type="text" placeholder="Enter your full name" value={formData.fullName} onChange={e => setFormData({
            ...formData,
            fullName: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12" />
          </div>

          {/* Email or Phone */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Email or Phone Number *</label>
            <Input type="text" placeholder="Enter email or 10-digit phone number" value={formData.emailOrPhone} onChange={e => setFormData({
            ...formData,
            emailOrPhone: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12" />
          </div>

          {/* Different WhatsApp */}
          <div className="flex items-center gap-2">
            <Checkbox checked={formData.differentWhatsApp} onCheckedChange={checked => setFormData({
            ...formData,
            differentWhatsApp: checked as boolean
          })} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
            <label className="text-sm text-foreground">Different WhatsApp Number</label>
          </div>

          {/* WhatsApp Number (Optional) */}
          {formData.differentWhatsApp && <div className="space-y-2">
              <label className="text-sm text-foreground">WhatsApp Number</label>
              <Input type="tel" placeholder="Enter 10-digit WhatsApp number" value={formData.whatsappNumber} onChange={e => setFormData({
            ...formData,
            whatsappNumber: e.target.value
          })} className="gold-border bg-secondary text-foreground placeholder:text-muted-foreground h-12" />
            </div>}

          {/* Registration Mode Toggle */}
          <div className="p-4 bg-secondary/30 border border-primary/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground font-medium">Registration Method</label>
              <button type="button" onClick={() => {
              setRegistrationMode(registrationMode === "pin" ? "otp" : "pin");
              setOtpSent(false);
              setOtp(["", "", "", "", "", ""]);
            }} className="text-xs text-primary hover:underline">
                Switch to {registrationMode === "pin" ? "OTP" : "PIN"}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRegistrationMode("pin")} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${registrationMode === "pin" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                4-Digit PIN Password
              </button>
              <button type="button" onClick={() => setRegistrationMode("otp")} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${registrationMode === "otp" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                6-Digit OTP Verification
              </button>
            </div>
          </div>

          {/* PIN Mode */}
          {registrationMode === "pin" && <>
              <div className="space-y-2">
                <label className="text-sm text-foreground">Create 4-Digit PIN (Password) *</label>
                <p className="text-xs text-muted-foreground">This will be your password for login</p>
                <div className="flex gap-3 justify-between">
                  {pin.map((digit, index) => <input key={index} id={`reg-pin-${index}`} type="password" maxLength={1} value={digit} onChange={e => handlePinChange(index, e.target.value, false)} className="pin-input" />)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">Confirm 4-Digit PIN *</label>
                <div className="flex gap-3 justify-between">
                  {confirmPin.map((digit, index) => <input key={index} id={`reg-confirm-pin-${index}`} type="password" maxLength={1} value={digit} onChange={e => handlePinChange(index, e.target.value, true)} className="pin-input" />)}
                </div>
              </div>
            </>}

          {/* OTP Mode */}
          {registrationMode === "otp" && !otpSent && <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground text-center">
                Click "Send OTP" below to receive a 6-digit verification code
              </p>
            </div>}

          {registrationMode === "otp" && otpSent && <div className="space-y-2">
              <label className="text-sm text-foreground">Enter 6-Digit OTP *</label>
              <p className="text-xs text-muted-foreground">
                OTP sent to {formData.emailOrPhone}
              </p>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => <input key={index} id={`reg-otp-${index}`} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(index, e.target.value)} className="pin-input" />)}
              </div>
            </div>}

          {/* Gender Selection */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Gender</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={e => setFormData({
                ...formData,
                gender: e.target.value
              })} className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Male</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={e => setFormData({
                ...formData,
                gender: e.target.value
              })} className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Female</span>
              </label>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-2">
            <Checkbox checked={formData.agreeToTerms} onCheckedChange={checked => setFormData({
            ...formData,
            agreeToTerms: checked as boolean
          })} className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground mt-1" />
            <label className="text-sm text-foreground">
              I agree to the <span className="text-primary">Terms & Conditions</span> and{" "}
              <span className="text-primary">Privacy Policy</span>
            </label>
          </div>

          {/* Info Message */}
          {registrationMode === "pin"}

          {/* Submit Buttons */}
          {registrationMode === "pin" && <Button onClick={handleRegisterWithPIN} disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50">
              {isLoading ? "Processing..." : "REGISTER WITH PIN"}
            </Button>}

          {registrationMode === "otp" && !otpSent && <Button onClick={handleSendOTPForRegistration} disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50">
              {isLoading ? "Sending OTP..." : "SEND OTP"}
            </Button>}

          {registrationMode === "otp" && otpSent && <Button onClick={handleVerifyOTPForRegistration} disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl disabled:opacity-50">
              {isLoading ? "Verifying..." : "VERIFY & REGISTER"}
            </Button>}

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
      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
        <MessageCircle className="w-7 h-7 text-white" fill="white" />
      </a>
    </div>;
}