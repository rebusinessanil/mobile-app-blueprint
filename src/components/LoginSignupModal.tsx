import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Star, Lock } from "lucide-react";

interface LoginSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function LoginSignupModal({ open, onOpenChange, onSuccess }: LoginSignupModalProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login form state
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPin, setLoginPin] = useState("");
  
  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupMobile, setSignupMobile] = useState("");
  const [signupPin, setSignupPin] = useState("");
  const [signupConfirmPin, setSignupConfirmPin] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginMobile || !loginPin) {
      toast.error("Please enter mobile number and PIN");
      return;
    }

    setIsLoading(true);
    try {
      const email = `${loginMobile}@rebusiness.in`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPin,
      });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Login successful!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupName || !signupMobile || !signupPin) {
      toast.error("Please fill all required fields");
      return;
    }

    if (signupPin !== signupConfirmPin) {
      toast.error("PINs do not match");
      return;
    }

    if (signupPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    // Close modal and navigate to register page with pre-filled data
    onOpenChange(false);
    navigate("/register", { 
      state: { 
        prefillName: signupName, 
        prefillMobile: signupMobile 
      } 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30 p-0 overflow-hidden">
        {/* Header with lock icon */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 border-b border-primary/20">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Unlock ReBusiness
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in or create an account to access all features
            </p>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="p-6">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-background border border-primary/20">
            <TabsTrigger 
              value="login"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-mobile" className="text-foreground">Mobile Number</Label>
                <Input
                  id="login-mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile"
                  value={loginMobile}
                  onChange={(e) => setLoginMobile(e.target.value)}
                  maxLength={10}
                  className="bg-background border-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-pin" className="text-foreground">4-Digit PIN</Label>
                <Input
                  id="login-pin"
                  type="password"
                  placeholder="Enter PIN"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  maxLength={4}
                  className="bg-background border-primary/30 focus:border-primary"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-foreground">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="bg-background border-primary/30 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-mobile" className="text-foreground">Mobile Number</Label>
                <Input
                  id="signup-mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile"
                  value={signupMobile}
                  onChange={(e) => setSignupMobile(e.target.value)}
                  maxLength={10}
                  className="bg-background border-primary/30 focus:border-primary"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={isLoading}
              >
                Continue to Register
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
