import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowUp, ArrowDown, Clock, ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

export default function Wallet() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [customerCode, setCustomerCode] = useState<string>("");
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    // Set up real-time subscription for credit updates
    const channel = supabase
      .channel("wallet-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log("Credit balance updated");
          fetchWalletData(userId);
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
        () => {
          console.log("New transaction detected");
          fetchWalletData(userId);
        }
      )
      .subscribe();

    return () => {
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
      setBalance(credits || { balance: 0, total_earned: 0, total_spent: 0 });

      // Fetch recent transactions (last 5)
      const { data: txns, error: txnsError } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(5);

      if (txnsError) throw txnsError;
      setTransactions(txns || []);
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
    <div className="min-h-screen bg-navy-dark pb-24">
      {/* Header */}
      <div className="relative px-6 pt-8 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-8 text-foreground hover:text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center justify-center gap-2">
          <WalletIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Balance Card */}
        <Card className="gold-border bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                ₹{balance?.balance || 0}
              </span>
              <span className="text-sm text-muted-foreground">.00</span>
            </div>
            {customerCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Customer Code:</span>
                <span className="font-mono font-semibold text-foreground">
                  {customerCode}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/my-downloads")}
                variant="outline"
                className="flex-1 border-primary/30 text-foreground hover:bg-primary/10 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                My Downloads
              </Button>
              <Button
                onClick={handleTopUp}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-500">
                  ₹{balance?.total_earned || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-card">
            <CardContent className="pt-6">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-red-500">
                  ₹{balance?.total_spent || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recents Section */}
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Recent Transactions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={() => navigate("/transactions")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                        <p className="font-medium text-foreground text-sm">
                          {txn.description || "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(txn.created_at), "MMM dd, yyyy • hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${getTransactionColor(
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
