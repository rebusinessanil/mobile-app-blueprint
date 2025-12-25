import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export default function LoginPromptModal({ open, onOpenChange, featureName = "this feature" }: LoginPromptModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate("/register");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-primary/30 rounded-3xl">
        <DialogHeader className="space-y-4">
          {/* Animated Icon */}
          <motion.div 
            className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ 
                rotateY: [0, 360],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            >
              <Lock className="w-10 h-10 text-primary" />
            </motion.div>
          </motion.div>

          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">
              Unlock Full Access
            </span>
          </DialogTitle>

          <DialogDescription className="text-center text-muted-foreground text-base">
            Sign up to access <span className="text-primary font-semibold">{featureName}</span> and create stunning promotional banners for your business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Benefits */}
          <div className="bg-background/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Create unlimited professional banners</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Access premium templates & stickers</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Get 199 free tokens on signup!</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSignup}
              className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>

            <Button 
              onClick={handleLogin}
              variant="outline"
              className="w-full h-12 text-lg font-medium border-2 border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
            >
              Already have an account? Login
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
