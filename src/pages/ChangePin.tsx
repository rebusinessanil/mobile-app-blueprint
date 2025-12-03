import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ChangePin() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  
  // PIN states
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [currentPinVerified, setCurrentPinVerified] = useState(false);
  
  // Show/hide states
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Get authenticated user and check for existing PIN
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to change your PIN");
        navigate("/login");
        return;
      }
      setUserId(user.id);
      
      // Check if user has an existing PIN
      const pinHash = user.user_metadata?.pin_hash;
      setHasExistingPin(!!pinHash);
      
      // If no existing PIN, skip verification step
      if (!pinHash) {
        setCurrentPinVerified(true);
      }
    };
    getUser();
  }, [navigate]);

  // Verify current PIN
  const handleVerifyCurrentPin = async () => {
    if (currentPin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const storedPinHash = user.user_metadata?.pin_hash;
    const enteredPinHash = btoa(currentPin);
    
    if (storedPinHash === enteredPinHash) {
      setCurrentPinVerified(true);
      setPinError("");
      toast.success("Current PIN verified");
    } else {
      setPinError("Incorrect current PIN");
    }
  };

  // Save new PIN
  const handleSaveNewPin = async () => {
    if (newPin.length !== 4) {
      toast.error("New PIN must be 4 digits");
      return;
    }
    if (confirmPin !== newPin) {
      setPinError("PINs do not match");
      return;
    }
    
    setLoading(true);
    try {
      const pinHash = btoa(newPin);
      const { error } = await supabase.auth.updateUser({
        data: { pin_hash: pinHash }
      });
      
      if (error) throw error;
      
      toast.success("PIN updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating PIN:", error);
      toast.error("Failed to update PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate("/profile")} 
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">Change PIN</h1>
            <p className="text-sm text-foreground">Secure your account</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Security Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="gold-border bg-card p-6 rounded-2xl space-y-6">
          {/* Current PIN Section - only if user has existing PIN */}
          {hasExistingPin && !currentPinVerified && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">Current PIN</label>
                <p className="text-xs text-muted-foreground">Enter your existing PIN to verify your identity</p>
                <div className="relative">
                  <Input
                    type={showCurrentPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCurrentPin(value);
                      if (pinError) setPinError("");
                    }}
                    placeholder="●●●●"
                    className={`gold-border bg-secondary text-foreground h-12 border-2 rounded-xl tracking-[0.5em] text-center text-lg pr-10 ${
                      pinError ? "border-destructive" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {pinError && currentPin.length > 0 && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
              </div>
              
              <Button
                onClick={handleVerifyCurrentPin}
                disabled={currentPin.length !== 4}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                Verify Current PIN
              </Button>
            </div>
          )}

          {/* New PIN Section - always visible but disabled until verified */}
          <div className={`space-y-4 transition-all duration-300 ${!currentPinVerified && hasExistingPin ? 'opacity-50 pointer-events-none' : ''}`}>
            {!hasExistingPin && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="text-sm text-foreground">No PIN set. Create your first PIN below.</p>
              </div>
            )}
            
            {hasExistingPin && currentPinVerified && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl">
                <Check className="w-5 h-5 text-green-500" />
                <p className="text-sm text-foreground">Current PIN verified. Enter your new PIN below.</p>
              </div>
            )}

            {hasExistingPin && !currentPinVerified && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Verify your current PIN above to change it.</p>
              </div>
            )}

            <div className="space-y-4 pt-2">
              {/* New PIN */}
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">New PIN</label>
                <div className="relative">
                  <Input
                    type={showNewPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPin}
                    disabled={!currentPinVerified}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewPin(value);
                      if (confirmPin) setConfirmPin("");
                      if (pinError) setPinError("");
                    }}
                    placeholder="●●●●"
                    className={`gold-border bg-secondary text-foreground h-12 border-2 rounded-xl tracking-[0.5em] text-center text-lg pr-10 transition-opacity duration-300 ${
                      !currentPinVerified ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    disabled={!currentPinVerified}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {currentPinVerified && newPin.length > 0 && newPin.length < 4 && (
                  <p className="text-sm text-destructive">PIN must be 4 digits</p>
                )}
              </div>

              {/* Confirm New PIN */}
              <div className="space-y-2">
                <label className="text-sm text-foreground font-medium">Confirm New PIN</label>
                <div className="relative">
                  <Input
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={confirmPin}
                    disabled={!currentPinVerified || newPin.length !== 4}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmPin(value);
                      if (value.length === 4) {
                        if (value !== newPin) {
                          setPinError("PIN does not match");
                        } else {
                          setPinError("");
                        }
                      } else {
                        setPinError("");
                      }
                    }}
                    placeholder="●●●●"
                    className={`gold-border bg-secondary text-foreground h-12 border-2 rounded-xl tracking-[0.5em] text-center text-lg pr-10 transition-all duration-300 ${
                      !currentPinVerified || newPin.length !== 4 ? 'opacity-50 cursor-not-allowed' : ''
                    } ${pinError ? "border-destructive" : confirmPin.length === 4 && confirmPin === newPin ? "border-green-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    disabled={!currentPinVerified || newPin.length !== 4}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {currentPinVerified && confirmPin.length === 4 && confirmPin === newPin && !pinError && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {currentPinVerified && pinError && (
                  <p className="text-sm text-destructive">{pinError}</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveNewPin}
              disabled={loading || !currentPinVerified || newPin.length !== 4 || confirmPin !== newPin}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300"
            >
              {loading ? "Saving..." : "Save New PIN"}
            </Button>
          </div>
        </div>

        {/* Security Tips */}
        <div className="gold-border bg-card/50 p-4 rounded-2xl">
          <h3 className="text-sm font-semibold text-primary mb-2">Security Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use a PIN that's easy for you to remember but hard for others to guess</li>
            <li>• Avoid using birthdates, phone numbers, or sequential numbers</li>
            <li>• Never share your PIN with anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
