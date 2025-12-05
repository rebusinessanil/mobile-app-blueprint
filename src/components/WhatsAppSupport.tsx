import { useState, useEffect } from "react";
import { X } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

const SUPPORT_NUMBER = "917734990035";
const HIDDEN_KEY = "whatsapp_support_hidden";

export default function WhatsAppSupport() {
  const [isHidden, setIsHidden] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const location = useLocation();

  // Check if on login/signup pages - WhatsApp icon cannot be closed on these pages
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        setUserId(user.id);
        // Fetch user name from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.name) {
          setUserName(profile.name);
        } else {
          setUserName(user.user_metadata?.name || user.email || "User");
        }

        // Check if hidden (only for authenticated users)
        const hidden = localStorage.getItem(HIDDEN_KEY);
        if (hidden === "true") {
          setIsHidden(true);
        }
      } else {
        // Not authenticated - always show, clear hidden state
        setIsHidden(false);
        setUserId(null);
        setUserName("");
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Clear hidden state on logout so it shows again on next login
        localStorage.removeItem(HIDDEN_KEY);
        setIsHidden(false);
        setIsAuthenticated(false);
        setUserId(null);
        setUserName("");
      } else if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        // Fetch profile name
        supabase
          .from("profiles")
          .select("name")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.name) {
              setUserName(data.name);
            } else {
              setUserName(session.user.user_metadata?.name || session.user.email || "User");
            }
          });
        
        // Check if was hidden before
        const hidden = localStorage.getItem(HIDDEN_KEY);
        setIsHidden(hidden === "true");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleWhatsAppClick = () => {
    // Build message with user details
    let message = "I need support";
    if (isAuthenticated && (userId || userName)) {
      const userIdPart = userId ? `User ID: ${userId.slice(0, 8)}...` : "";
      const userNamePart = userName ? `Name: ${userName}` : "";
      message = `${userIdPart}\n${userNamePart}\nI need support`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SUPPORT_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(HIDDEN_KEY, "true");
    setIsHidden(true);
  };

  // Don't render if hidden (only applies to authenticated users who closed it)
  if (isHidden && isAuthenticated) return null;

  // Show close button only for authenticated users (not on auth pages)
  const showCloseButton = isAuthenticated && !isAuthPage;

  return (
    <div className="fixed bottom-24 left-6 z-50 group">
      <button
        onClick={handleWhatsAppClick}
        className="relative w-14 h-14 transition-all duration-300 hover:scale-110"
        aria-label="Contact support on WhatsApp"
      >
        <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
      </button>
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="absolute -top-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center opacity-100 transition-opacity duration-200"
          aria-label="Close WhatsApp support"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
