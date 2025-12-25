import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUPPORT_NUMBER = "917734990035";

export default function WhatsAppDiscovery() {
  const [isHovered, setIsHovered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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
      }
    };
    checkAuth();
  }, []);

  const handleClick = () => {
    let message = "I need support";
    if (userId || userName) {
      const userIdPart = userId ? `User ID: ${userId.slice(0, 8)}...` : "";
      const userNamePart = userName ? `Name: ${userName}` : "";
      message = `${userIdPart}\n${userNamePart}\nI need support`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SUPPORT_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-primary/30 shadow-lg shadow-primary/20 overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        width: isHovered ? 180 : 52,
        height: 52,
      }}
      transition={{ 
        opacity: { delay: 0.5, duration: 0.3 },
        y: { delay: 0.5, duration: 0.3 },
        width: { duration: 0.3, ease: "easeOut" },
      }}
      aria-label="Contact support on WhatsApp"
    >
      {/* Idle State: Gold Chat Bubble */}
      <motion.div
        className="flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center"
        animate={{ 
          scale: isHovered ? 0.9 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          animate={{
            opacity: isHovered ? 0 : 1,
            scale: isHovered ? 0.8 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <MessageCircle className="w-6 h-6 text-primary" fill="currentColor" />
        </motion.div>
        
        {/* WhatsApp Logo on Hover */}
        <motion.div
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          transition={{ duration: 0.2 }}
          className="absolute"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6"
            fill="#25D366"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </motion.div>
      </motion.div>
      
      {/* Expanded Text */}
      <motion.span
        className="text-sm font-medium text-white whitespace-nowrap pr-4"
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : -10,
        }}
        transition={{ duration: 0.2, delay: isHovered ? 0.1 : 0 }}
      >
        Chat with Support
      </motion.span>
    </motion.button>
  );
}
