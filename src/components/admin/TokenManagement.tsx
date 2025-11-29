import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface TokenStats {
  total_credits_in_circulation: number;
  total_credits_earned: number;
  total_credits_spent: number;
  recent_transactions: Array<{
    id: string;
    user_name: string;
    amount: number;
    transaction_type: string;
    description: string;
    created_at: string;
  }>;
}

export default function TokenManagement() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenStats();

    // Set up real-time subscriptions for instant admin panel updates
    const channel = supabase
      .channel('admin-token-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
        },
        () => {
          console.log('Credits updated, refreshing admin stats');
          fetchTokenStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_transactions',
        },
        () => {
          console.log('Transaction detected, refreshing admin stats');
          fetchTokenStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTokenStats = async () => {
    try {
      // Fetch credit stats
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance, total_earned, total_spent');

      if (creditsError) throw creditsError;

      const totalInCirculation = credits?.reduce((sum, c) => sum + c.balance, 0) || 0;
      const totalEarned = credits?.reduce((sum, c) => sum + c.total_earned, 0) || 0;
      const totalSpent = credits?.reduce((sum, c) => sum + c.total_spent, 0) || 0;

      // Fetch recent transactions
      const { data: transactions, error: txError } = await supabase
        .from('credit_transactions')
        .select('id, user_id, amount, transaction_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;

      // Fetch user names
      const userIds = transactions?.map(tx => tx.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const recentTransactions = transactions?.map(tx => {
        const profile = profiles?.find(p => p.user_id === tx.user_id);
        return {
          id: tx.id,
          user_name: profile?.name || 'Unknown User',
          amount: tx.amount,
          transaction_type: tx.transaction_type,
          description: tx.description || '',
          created_at: tx.created_at,
        };
      }) || [];

      setStats({
        total_credits_in_circulation: totalInCirculation,
        total_credits_earned: totalEarned,
        total_credits_spent: totalSpent,
        recent_transactions: recentTransactions,
      });
    } catch (error: any) {
      console.error('Error fetching token stats:', error);
      toast.error("Failed to load token statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading token stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  const getTransactionIcon = (type: string) => {
    if (type.includes('earned') || type.includes('grant')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTransactionColor = (type: string) => {
    if (type.includes('earned') || type.includes('grant')) {
      return 'text-green-500';
    }
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="gold-border bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Credits in Circulation</p>
              <p className="text-3xl font-bold text-primary">{stats.total_credits_in_circulation}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="gold-border bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stats.total_credits_earned}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </div>

          <div className="gold-border bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stats.total_credits_spent}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="gold-border bg-card rounded-2xl p-5">
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Recent Transactions
        </h3>
        <div className="space-y-2">
          {stats.recent_transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                {getTransactionIcon(tx.transaction_type)}
                <div>
                  <p className="font-medium text-foreground text-sm">{tx.user_name}</p>
                  <p className="text-xs text-muted-foreground">{tx.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${getTransactionColor(tx.transaction_type)}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        💡 New users automatically receive 10 free credits upon registration
      </p>
    </div>
  );
}
