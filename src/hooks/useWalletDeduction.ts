import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BANNER_DOWNLOAD_COST = 10;

interface DeductionResult {
  success: boolean;
  insufficientBalance: boolean;
  newBalance?: number;
}

export function useWalletDeduction() {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkAndDeductBalance = async (
    userId: string,
    categoryName: string,
    bannerUrl?: string,
    templateId?: string,
    customCost?: number
  ): Promise<DeductionResult> => {
    const cost = customCost ?? BANNER_DOWNLOAD_COST;
    try {
      setIsProcessing(true);

      // Use the secure SECURITY DEFINER function for atomic credit deduction
      // This prevents client-side manipulation of credits
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: cost,
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
