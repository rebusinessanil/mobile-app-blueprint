import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BANNER_DOWNLOAD_COST = 10;

interface DeductionResult {
  success: boolean;
  insufficientBalance: boolean;
  newBalance?: number;
  isAdminBypass?: boolean;
}

interface WalletDeductionOptions {
  skipDeductionForAdmin?: boolean;
}

export function useWalletDeduction(options: WalletDeductionOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkAndDeductBalance = async (
    userId: string,
    categoryName: string,
    bannerUrl?: string,
    templateId?: string,
    isAdmin?: boolean
  ): Promise<DeductionResult> => {
    try {
      setIsProcessing(true);

      // ADMIN BYPASS: Admins can download banners without credit deduction
      // Still record the download for tracking purposes
      if (isAdmin && options.skipDeductionForAdmin !== false) {
        // Record download without deducting credits
        if (categoryName) {
          await supabase.from('banner_downloads').insert({
            user_id: userId,
            category_name: categoryName,
            banner_url: bannerUrl || null,
            template_id: templateId || null,
            downloaded_at: new Date().toISOString()
          });
        }
        
        return { 
          success: true, 
          insufficientBalance: false,
          isAdminBypass: true
        };
      }

      // Use the secure SECURITY DEFINER function for atomic credit deduction
      // This prevents client-side manipulation of credits
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: BANNER_DOWNLOAD_COST,
        p_description: `Banner download - ${categoryName}`,
        p_category_name: categoryName,
        p_banner_url: bannerUrl || null,
        p_template_id: templateId || null
      });

      if (error) {
        console.error("Credit deduction error:", error);
        toast.error("Failed to process wallet transaction");
        return { success: false, insufficientBalance: false };
      }

      // Parse the response from the function
      const result = data as { success: boolean; error?: string; balance?: number; new_balance?: number };

      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          return { success: false, insufficientBalance: true };
        }
        toast.error(result.error || "Transaction failed");
        return { success: false, insufficientBalance: false };
      }

      return { 
        success: true, 
        insufficientBalance: false,
        newBalance: result.new_balance 
      };
    } catch (error) {
      console.error("Wallet deduction error:", error);
      toast.error("An error occurred during wallet processing");
      return { success: false, insufficientBalance: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    checkAndDeductBalance,
    isProcessing,
  };
}
