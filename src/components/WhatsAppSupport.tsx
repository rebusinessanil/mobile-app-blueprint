import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const SUPPORT_NUMBER = "917734990035";
const WHATSAPP_URL = `https://wa.me/${SUPPORT_NUMBER}`;

export default function WhatsAppSupport() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Check if user has hidden the widget
        const hidden = localStorage.getItem("whatsapp-support-hidden");
        setIsVisible(hidden !== "true");
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      
      // Reset visibility on login
      if (event === "SIGNED_IN") {
        localStorage.removeItem("whatsapp-support-hidden");
        setIsVisible(true);
      }
      
      // Hide on logout
      if (event === "SIGNED_OUT") {
        setIsVisible(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("whatsapp-support-hidden", "true");
  };

  const handleWhatsAppClick = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  if (!isAuthenticated || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2">
      {/* Close button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handleClose}
        className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-foreground"
        aria-label="Close WhatsApp support"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* WhatsApp FAB */}
      <Button
        size="icon"
        onClick={handleWhatsAppClick}
        className="w-14 h-14 bg-transparent hover:bg-transparent border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 p-0"
        aria-label="Contact support on WhatsApp"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-14 h-14 object-contain" />
      </Button>

      {/* Tooltip */}
      <div className="absolute right-16 bottom-2 bg-card border border-primary/20 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <p className="text-sm font-medium text-foreground">Need Help?</p>
        <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
      </div>
    </div>
  );
}
