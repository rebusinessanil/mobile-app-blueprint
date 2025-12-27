import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export type AppRole = "admin" | "user";

interface UserRoleState {
  role: AppRole | null;
  isAdmin: boolean;
  isUser: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and cache user role from database
 * Uses the is_admin RPC function for secure server-side role checking
 */
export function useUserRole(userId?: string) {
  const [state, setState] = useState<UserRoleState>({
    role: null,
    isAdmin: false,
    isUser: false,
    isLoading: true,
    error: null,
  });

  const checkRole = useCallback(async (uid: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use the is_admin RPC function - this is secure server-side check
      const { data: isAdminResult, error } = await supabase.rpc('is_admin', { 
        user_id: uid 
      });

      if (error) {
        logger.error("Error checking admin status:", error);
        setState({
          role: "user",
          isAdmin: false,
          isUser: true,
          isLoading: false,
          error: error as Error,
        });
        return { role: "user" as AppRole, isAdmin: false };
      }

      const isAdmin = isAdminResult === true;
      const role: AppRole = isAdmin ? "admin" : "user";

      setState({
        role,
        isAdmin,
        isUser: !isAdmin,
        isLoading: false,
        error: null,
      });

      return { role, isAdmin };
    } catch (err) {
      logger.error("Error in useUserRole:", err);
      setState({
        role: "user",
        isAdmin: false,
        isUser: true,
        isLoading: false,
        error: err as Error,
      });
      return { role: "user" as AppRole, isAdmin: false };
    }
  }, []);

  useEffect(() => {
    if (userId) {
      checkRole(userId);
    } else {
      setState({
        role: null,
        isAdmin: false,
        isUser: false,
        isLoading: false,
        error: null,
      });
    }
  }, [userId, checkRole]);

  return {
    ...state,
    refetch: () => userId ? checkRole(userId) : Promise.resolve({ role: null, isAdmin: false }),
  };
}

/**
 * Utility function to check user role (for use outside of hooks)
 * Returns role and redirect path based on role
 */
export async function getUserRoleAndRedirect(userId: string): Promise<{
  role: AppRole;
  isAdmin: boolean;
  redirectPath: string;
}> {
  try {
    const { data: isAdminResult, error } = await supabase.rpc('is_admin', { 
      user_id: userId 
    });

    if (error) {
      logger.error("Error checking admin status:", error);
      return { role: "user", isAdmin: false, redirectPath: "/dashboard" };
    }

    const isAdmin = isAdminResult === true;
    
    return {
      role: isAdmin ? "admin" : "user",
      isAdmin,
      redirectPath: isAdmin ? "/admin" : "/dashboard",
    };
  } catch (err) {
    logger.error("Error getting user role:", err);
    return { role: "user", isAdmin: false, redirectPath: "/dashboard" };
  }
}

/**
 * Check if current path matches user role (for route protection)
 */
export function isPathAllowedForRole(path: string, isAdmin: boolean): boolean {
  // Cleaned up admin paths - removed deprecated routes
  const adminPaths = [
    "/admin",
    "/admin/users",
    "/admin/templates",
    "/admin/stories",
    "/admin/ranks",
    "/admin/stickers",
    "/admin/sticker-management",
    "/admin/template-backgrounds",
    "/admin/banner-defaults",
    "/admin/banner-carousel",
    "/admin/auto-stories",
  ];

  const isAdminPath = adminPaths.some(adminPath => 
    path === adminPath || path.startsWith(adminPath + "/")
  );

  // Admin paths only allowed for admins
  if (isAdminPath && !isAdmin) {
    return false;
  }

  // User paths not allowed for admins (they should stay in admin area)
  // But allow profile-edit for all users
  const allowedForBoth = ["/profile-edit", "/profile-setup", "/change-pin"];
  if (!isAdminPath && isAdmin && !allowedForBoth.includes(path)) {
    return false;
  }

  return true;
}
