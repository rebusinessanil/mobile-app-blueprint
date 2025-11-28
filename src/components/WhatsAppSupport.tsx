import { useState, useEffect } from "react";
import { X } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_NUMBER = "917734990035";
const WHATSAPP_URL = `https://wa.me/${SUPPORT_NUMBER}`;
const HIDDEN_KEY = "whatsapp_support_hidden";

export default function WhatsAppSupport() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Check if hidden in localStorage (persists after logout)
    const hidden = localStorage.getItem(HIDDEN_KEY);
    if (hidden === "true") {
      setIsHidden(true);
    }

    // Listen for logout events to keep icon hidden
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Keep hidden state after logout
        const wasHidden = localStorage.getItem(HIDDEN_KEY);
        if (wasHidden === "true") {
          setIsHidden(true);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleWhatsAppClick = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(HIDDEN_KEY, "true");
    setIsHidden(true);
  };

  if (isHidden) return null;

  return (
    <div className="fixed bottom-24 left-6 z-50 group">
      <button
        onClick={handleWhatsAppClick}
        className="relative w-14 h-14 transition-all duration-300 hover:scale-110"
        aria-label="Contact support on WhatsApp"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
      </button>
      <button
        onClick={handleClose}
        className="absolute -top-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center opacity-100 transition-opacity duration-200"
        aria-label="Close WhatsApp support"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}
