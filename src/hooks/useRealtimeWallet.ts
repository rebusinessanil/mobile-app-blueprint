import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WalletState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date | null;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export function useRealtimeWallet(userId: string | null) {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastUpdated: null,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch credit balance
      const { data: credits, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance, total_earned, total_spent")
        .eq("user_id", userId)
        .maybeSingle();

      if (creditsError) throw creditsError;

      // Fetch transactions
      const { data: txns, error: txnsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (txnsError) throw txnsError;

      setTransactions(txns || []);
      setWallet({
        balance: credits?.balance || 0,
        totalEarned: credits?.total_earned || 0,
        totalSpent: credits?.total_spent || 0,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchWalletData();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel(`realtime-wallet-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 Wallet balance updated:", payload);
          if (payload.new && 'balance' in payload.new) {
            const newData = payload.new as any;
            setWallet(prev => ({
              ...prev,
              balance: newData.balance,
              totalEarned: newData.total_earned || prev.totalEarned,
              totalSpent: newData.total_spent || prev.totalSpent,
              lastUpdated: new Date(),
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "credit_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔄 New transaction:", payload);
          if (payload.new) {
            const newTx = payload.new as Transaction;
            setTransactions(prev => [newTx, ...prev]);
            
            // Show toast for admin credits
            if (newTx.transaction_type === 'admin_credit') {
              toast.success(`+₹${newTx.amount} credited to your wallet!`);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Wallet real-time sync active for user:', userId);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchWalletData]);

  return {
    wallet,
    transactions,
    loading,
    refetch: fetchWalletData,
  };
}
