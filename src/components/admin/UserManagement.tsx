import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Crown, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
  user_id: string;
  name: string;
  email: string;
  mobile: string; // Required field as per database schema
  rank: string | null;
  created_at: string;
  balance: number;
  is_admin: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with mobile numbers
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, mobile, rank, created_at');

      if (profileError) throw profileError;

      // Fetch credits
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance');

      if (creditsError) throw creditsError;

      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Combine data
      const combinedUsers: UserData[] = profiles?.map(profile => {
        const userCredit = credits?.find(c => c.user_id === profile.user_id);
        const isAdmin = adminRoles?.some(r => r.user_id === profile.user_id) || false;

        return {
          user_id: profile.user_id,
          name: profile.name,
          email: 'N/A', // Email not available without admin API
          mobile: profile.mobile,
          rank: profile.rank,
          created_at: profile.created_at || '',
          balance: userCredit?.balance || 0,
          is_admin: isAdmin,
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async (action: 'add' | 'deduct') => {
    if (!selectedUser) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      // Get current balance or create if doesn't exist
      const { data: currentCredit, error: fetchError } = await supabase
        .from('user_credits')
        .select('balance, total_earned, total_spent')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user credits:', fetchError);
        throw new Error(`Failed to fetch credits: ${fetchError.message}`);
      }

      // If no record exists, create one
      if (!currentCredit) {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: selectedUser.user_id,
            balance: action === 'add' ? amount : 0,
            total_earned: action === 'add' ? amount : 0,
            total_spent: 0,
          });

        if (insertError) {
          console.error('Error creating user credits:', insertError);
          throw new Error(`Failed to create credits: ${insertError.message}`);
        }
      } else {
        const newBalance = action === 'add' 
          ? currentCredit.balance + amount 
          : currentCredit.balance - amount;

        if (newBalance < 0) {
          toast.error("Insufficient balance to deduct");
          return;
        }

        // Update balance
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            balance: newBalance,
            total_earned: action === 'add' ? currentCredit.total_earned + amount : currentCredit.total_earned,
            total_spent: action === 'deduct' ? currentCredit.total_spent + amount : currentCredit.total_spent,
          })
          .eq('user_id', selectedUser.user_id);

        if (updateError) {
          console.error('Error updating user credits:', updateError);
          throw new Error(`Failed to update credits: ${updateError.message}`);
        }
      }

      // Log transaction
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.user_id,
          amount: action === 'add' ? amount : -amount,
          transaction_type: action === 'add' ? 'admin_credit' : 'spent',
          description: `Admin ${action === 'add' ? 'added' : 'deducted'} ₹${amount}`,
        });

      if (txError) {
        console.error('Error logging transaction:', txError);
        throw new Error(`Failed to log transaction: ${txError.message}`);
      }

      toast.success(`Successfully ${action === 'add' ? 'added' : 'deducted'} ${amount} credits`);
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      toast.error(error.message || "Failed to adjust credits");
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 gold-border bg-secondary"
        />
      </div>

      {/* Users Table */}
      <div className="gold-border bg-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20 hover:bg-transparent">
              <TableHead className="text-primary font-semibold">User</TableHead>
              <TableHead className="text-primary font-semibold">Mobile</TableHead>
              <TableHead className="text-primary font-semibold">Email</TableHead>
              <TableHead className="text-primary font-semibold">Credits</TableHead>
              <TableHead className="text-primary font-semibold">Role</TableHead>
              <TableHead className="text-primary font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.user_id} className="border-primary/10">
                <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.mobile}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                    {user.balance}
                  </span>
                </TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Crown className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      User
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDialogOpen(true);
                    }}
                    className="text-xs border-primary/30 hover:bg-primary/10"
                  >
                    Manage Credits
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Credit Management Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage Credits for {selectedUser?.name}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Current balance: {selectedUser?.balance} credits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="gold-border bg-secondary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => handleAdjustCredits('add')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
            <Button
              onClick={() => handleAdjustCredits('deduct')}
              variant="destructive"
            >
              <Minus className="w-4 h-4 mr-2" />
              Deduct Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-center text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
