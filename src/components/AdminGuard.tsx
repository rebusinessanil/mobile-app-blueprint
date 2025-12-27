import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import GoldCoinLoader from "@/components/GoldCoinLoader";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please log in to continue");
          navigate("/login");
          return;
        }

        // Check if user is admin using the is_admin RPC function
        const { data: adminStatus, error } = await supabase
          .rpc('is_admin', { user_id: user.id });

        if (error) {
          logger.error("Admin check error:", error);
          toast.error("Failed to verify permissions");
          navigate("/dashboard");
          return;
        }

        if (!adminStatus) {
          toast.error("Access Denied: Admin privileges required");
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        logger.error("Admin guard error:", error);
        toast.error("Authentication error");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GoldCoinLoader size="xl" message="Verifying permissions..." />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
