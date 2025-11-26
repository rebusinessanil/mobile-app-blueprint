import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BANNER_DOWNLOAD_COST = 10;

export function useWalletDeduction() {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkAndDeductBalance = async (
    userId: string,
    categoryName: string,
    bannerUrl?: string,
    templateId?: string
  ): Promise<{ success: boolean; insufficientBalance: boolean }> => {
    try {
      setIsProcessing(true);

      // 1. Check current balance
      const { data: credits, error: fetchError } = await supabase
        .from("user_credits")
        .select("balance, total_spent")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        toast.error("Failed to check wallet balance");
        return { success: false, insufficientBalance: false };
      }

      const currentBalance = credits?.balance || 0;

      // 2. If balance < 10, return insufficient balance flag
      if (currentBalance < BANNER_DOWNLOAD_COST) {
        return { success: false, insufficientBalance: true };
      }

      // 3. Deduct ₹10 from wallet
      const newBalance = currentBalance - BANNER_DOWNLOAD_COST;
      const newTotalSpent = (credits?.total_spent || 0) + BANNER_DOWNLOAD_COST;

      const { error: updateError } = await supabase
        .from("user_credits")
        .update({
          balance: newBalance,
          total_spent: newTotalSpent,
        })
        .eq("user_id", userId);

      if (updateError) {
        toast.error("Failed to deduct wallet balance");
        return { success: false, insufficientBalance: false };
      }

      // 4. Add transaction record
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: -BANNER_DOWNLOAD_COST,
          transaction_type: "spent",
          description: `Banner download - ${categoryName}`,
        });

      if (transactionError) {
        console.error("Failed to record transaction:", transactionError);
        // Don't block download if transaction fails, but log it
      }

      // 5. Add download history record
      const { error: downloadError } = await supabase
        .from("banner_downloads")
        .insert({
          user_id: userId,
          category_name: categoryName,
          banner_url: bannerUrl,
          template_id: templateId,
        });

      if (downloadError) {
        console.error("Failed to record download:", downloadError);
        // Don't block download if history recording fails
      }

      return { success: true, insufficientBalance: false };
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
