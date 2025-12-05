import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowUp, ArrowDown, Clock, ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { formatToIST } from "@/lib/dateUtils";
import BottomNav from "@/components/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreditBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface LastRecharge {
  amount: number;
  date: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [customerCode, setCustomerCode] = useState<string>("");
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastRecharge, setLastRecharge] = useState<LastRecharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Fetch profile for customer code
      const { data: profile } = await supabase
        .from("profiles")
        .select("customer_code")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profile?.customer_code) {
        setCustomerCode(profile.customer_code);
      }

      await fetchWalletData(user.id);
      setLoading(false);
    };

    initializeWallet();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscription for instant credit updates
    const channel = supabase
      .channel(`wallet-updates-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Credit balance updated in real-time:", payload);
          // Immediately update balance from payload for instant display
          if (payload.new && 'balance' in payload.new) {
            setBalance(prev => prev ? {
              ...prev,
              balance: (payload.new as any).balance
            } : null);
          }
          // Fetch full wallet data to ensure all fields are in sync
          fetchWalletData(userId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "credit_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New transaction detected in real-time:", payload);
          // Fetch full wallet data including new transaction
          fetchWalletData(userId);
        }
      )
      .subscribe((status) => {
        console.log("Wallet subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Wallet real-time sync active');
        }
      });

    return () => {
      console.log("Cleaning up wallet subscription");
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchWalletData = async (uid: string) => {
    try {
      // Fetch credit balance
      const { data: credits, error: creditsError } = await supabase
        .from("user_credits")
        .select("balance, total_earned, total_spent")
        .eq("user_id", uid)
        .maybeSingle();

      if (creditsError) throw creditsError;

      // Fetch all transactions
      const { data: txns, error: txnsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (txnsError) throw txnsError;
      setTransactions(txns || []);

      // Fetch last recharge (earned or admin_credit)
      const { data: rechargeData } = await supabase
        .from("credit_transactions")
        .select("amount, created_at")
        .eq("user_id", uid)
        .in("transaction_type", ["earned", "admin_credit"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rechargeData) {
        setLastRecharge({
          amount: rechargeData.amount,
          date: rechargeData.created_at,
        });
      }

      // Calculate Total Spent: Sum of all debit transactions
      const totalSpent = txns
        ?.filter(t => t.transaction_type === "spent" || t.transaction_type === "debit")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setBalance({
        balance: credits?.balance || 0,
        total_earned: credits?.total_earned || 0,
        total_spent: totalSpent,
      });
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    }
  };

  const handleTopUp = () => {
    setShowTopUpModal(true);
  };

  const getTransactionIcon = (type: string) => {
    return type === "earned" || type === "admin_credit" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type === "earned" || type === "admin_credit"
      ? "text-green-500"
      : "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-primary">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-navy-dark flex flex-col overflow-hidden">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-6 text-foreground hover:text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center justify-center gap-2">
          <WalletIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>
      </div>

      <div className="px-6 space-y-4 flex-shrink-0">
        {/* Balance Card */}
        <Card className="gold-border bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">
                ₹{balance?.balance || 0}
              </span>
              <span className="text-xs text-muted-foreground">.00</span>
            </div>
            {customerCode && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Customer Code:</span>
                <span className="font-mono font-semibold text-foreground">
                  {customerCode}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/my-downloads")}
                variant="outline"
                size="sm"
                className="flex-1 border-primary/30 text-foreground hover:bg-primary/10 rounded-lg text-xs h-9"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                My Downloads
              </Button>
              <Button
                onClick={handleTopUp}
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-9"
              >
                <ArrowUp className="w-3.5 h-3.5 mr-1.5" />
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="text-center space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Last Recharge</p>
                {lastRecharge ? (
                  <>
                    <p className="text-xl font-bold text-green-500">
                      ₹{lastRecharge.amount}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatToIST(lastRecharge.date).split(' • ')[0]}
                    </p>
                    <p className="text-xs text-red-500 font-semibold mt-1">
                      Spent: ₹{Math.max(0, lastRecharge.amount - (balance?.balance || 0))}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-muted-foreground">
                    ₹0
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-5 pb-5">
              <div className="text-center space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium">Total Spent</p>
                <p className="text-xl font-bold text-red-500">
                  ₹{balance?.total_spent || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Transactions Section - Scrollable */}
      <div className="px-6 flex-1 flex flex-col min-h-0 pb-20 mt-2">
        <Card className="border-primary/20 bg-card flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="text-base font-semibold text-foreground">
              All Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          txn.transaction_type === "earned" ||
                          txn.transaction_type === "admin_credit"
                            ? "bg-green-500/10"
                            : "bg-red-500/10"
                        }`}
                      >
                        <span
                          className={getTransactionColor(txn.transaction_type)}
                        >
                          {getTransactionIcon(txn.transaction_type)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-xs leading-tight">
                          {txn.description || "Transaction"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatToIST(txn.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold text-sm ${getTransactionColor(
                        txn.transaction_type
                      )}`}
                    >
                      {txn.transaction_type === "earned" ||
                      txn.transaction_type === "admin_credit"
                        ? "+"
                        : "-"}
                      ₹{Math.abs(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top-Up Modal */}
      <Dialog open={showTopUpModal} onOpenChange={setShowTopUpModal}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Request Top-Up</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Contact your admin to add credits to your wallet. Share your
              customer code: <span className="font-mono font-semibold text-primary">{customerCode}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              You can request a top-up by contacting your team administrator or
              through the support channel.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowTopUpModal(false);
                  window.open("https://wa.me/917734990035", "_blank", "noopener,noreferrer");
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
