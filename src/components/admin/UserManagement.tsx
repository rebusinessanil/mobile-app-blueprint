import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Crown, User, Key, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
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
  mobile: string;
  rank: string | null;
  created_at: string;
  balance: number;
  is_admin: boolean;
  has_pin?: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // PIN management state
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ has_pin: boolean; plain_pin: string | null } | null>(null);

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscriptions for instant admin panel updates
    const channel = supabase
      .channel('admin-user-management-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_credits' },
        (payload) => {
          console.log('🔄 Admin: Credits updated', payload);
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('🔄 Admin: Profile updated', payload);
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'credit_transactions' },
        (payload) => {
          console.log('🔄 Admin: Transaction created', payload);
          fetchUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('🔄 Admin: Roles updated', payload);
          fetchUsers();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Admin user management real-time sync active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with mobile numbers and profile_completed status
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, mobile, rank, created_at, profile_completed, welcome_bonus_given')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch credits with all fields
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance, total_earned, total_spent');

      if (creditsError) throw creditsError;

      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Combine data - filter out any profiles that might be orphaned
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
      console.log(`✅ Loaded ${combinedUsers.length} users, ${adminRoles?.length || 0} admins`);
    } catch (error: any) {
      console.error('Failed to load users:', error);
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
        throw new Error(`Failed to log transaction: ${txError.message}`);
      }

      toast.success(`Successfully ${action === 'add' ? 'added' : 'deducted'} ${amount} credits`);
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust credits");
    }
  };

  // PIN Management functions
  const handleOpenPinDialog = async (user: UserData) => {
    setSelectedUser(user);
    setNewPin("");
    setShowPin(false);
    setPinStatus(null);
    setIsPinDialogOpen(true);
    
    // Fetch PIN status
    setPinLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-pin-management', {
        body: { action: 'check_pin_status', target_user_id: user.user_id },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      setPinStatus(data);
    } catch (error: any) {
      console.error("Error checking PIN status:", error);
      toast.error("Failed to check PIN status");
    } finally {
      setPinLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!selectedUser || !newPin) return;
    
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    setPinLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-pin-management', {
        body: { action: 'reset_pin', target_user_id: selectedUser.user_id, new_pin: newPin },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      
      // Update PIN status with the new PIN
      setPinStatus({ has_pin: true, plain_pin: data.plain_pin || newPin });
      toast.success("PIN reset successfully");
      setNewPin("");
      setShowPin(true); // Show the new PIN after reset
    } catch (error: any) {
      console.error("Error resetting PIN:", error);
      toast.error(error.message || "Failed to reset PIN");
    } finally {
      setPinLoading(false);
    }
  };

  // Delete user profile and all related data
  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This will remove all their data including credits, transactions, and settings.`)) {
      return;
    }

    try {
      // Delete in order: transactions, credits, settings, photos, banners, profile
      await supabase.from('credit_transactions').delete().eq('user_id', user.user_id);
      await supabase.from('user_credits').delete().eq('user_id', user.user_id);
      await supabase.from('user_banner_settings').delete().eq('user_id', user.user_id);
      await supabase.from('category_banner_settings').delete().eq('user_id', user.user_id);
      await supabase.from('profile_photos').delete().eq('user_id', user.user_id);
      await supabase.from('banner_downloads').delete().eq('user_id', user.user_id);
      await supabase.from('banners').delete().eq('user_id', user.user_id);
      await supabase.from('trip_achievements').delete().eq('user_id', user.user_id);
      await supabase.from('user_roles').delete().eq('user_id', user.user_id);
      
      // Finally delete profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', user.user_id);
      if (error) throw error;

      toast.success(`User ${user.name} deleted successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Cleanup orphaned profiles (profiles without auth users)
  const handleCleanupOrphans = async () => {
    if (!confirm('This will remove profile data for users that no longer exist in authentication. Continue?')) {
      return;
    }

    try {
      toast.loading('Cleaning up orphaned profiles...');
      
      // Get all profile user_ids
      const { data: profiles } = await supabase.from('profiles').select('user_id');
      
      if (!profiles || profiles.length === 0) {
        toast.dismiss();
        toast.info('No profiles to clean up');
        return;
      }

      // We can't directly query auth.users from client, so we'll check by trying to get user credits
      // Orphaned profiles typically don't have proper auth sessions
      let cleanedCount = 0;
      
      for (const profile of profiles) {
        // Try to check if this user exists by their activity
        const { data: hasCredits } = await supabase
          .from('user_credits')
          .select('user_id')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        
        // If no credits record exists and profile has placeholder mobile, likely orphaned
        const { data: profileData } = await supabase
          .from('profiles')
          .select('mobile, name, created_at')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        
        if (profileData && profileData.mobile === '+000000000000') {
          // Delete this orphaned profile
          await supabase.from('credit_transactions').delete().eq('user_id', profile.user_id);
          await supabase.from('user_credits').delete().eq('user_id', profile.user_id);
          await supabase.from('profiles').delete().eq('user_id', profile.user_id);
          cleanedCount++;
        }
      }

      toast.dismiss();
      toast.success(`Cleaned up ${cleanedCount} orphaned profiles`);
      fetchUsers();
    } catch (error: any) {
      toast.dismiss();
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup orphaned profiles');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalUsers = users.length;
  const totalCredits = users.reduce((sum, u) => sum + u.balance, 0);
  const adminCount = users.filter(u => u.is_admin).length;
  const today = new Date().toDateString();
  const newUsersToday = users.filter(u => new Date(u.created_at).toDateString() === today).length;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gold-border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
        <div className="gold-border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
              <p className="text-xs text-muted-foreground">Total Credits</p>
            </div>
          </div>
        </div>
        <div className="gold-border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{adminCount}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </div>
        </div>
        <div className="gold-border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{newUsersToday}</p>
              <p className="text-xs text-muted-foreground">New Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 gold-border bg-secondary"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCleanupOrphans}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Cleanup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          className="border-primary/30 hover:bg-primary/10"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
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
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDialogOpen(true);
                      }}
                      className="text-xs border-primary/30 hover:bg-primary/10 px-2"
                    >
                      Credits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPinDialog(user)}
                      className="text-xs border-primary/30 hover:bg-primary/10 px-2"
                    >
                      <Key className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(user)}
                      className="text-xs border-destructive/30 hover:bg-destructive/10 text-destructive px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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

      {/* PIN Management Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="bg-card border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              PIN Management - {selectedUser?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View PIN status and reset user PIN securely
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* PIN Status */}
            <div className="p-4 rounded-xl bg-secondary border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">PIN Status</span>
                {pinLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <span className={`text-sm font-semibold ${pinStatus?.has_pin ? 'text-green-500' : 'text-red-500'}`}>
                    {pinStatus?.has_pin ? 'PIN Set' : 'No PIN'}
                  </span>
                )}
              </div>
              {pinStatus?.has_pin && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Current PIN</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground text-lg tracking-widest">
                      {pinStatus.plain_pin 
                        ? (showPin ? pinStatus.plain_pin : '••••') 
                        : 'Not available'}
                    </span>
                    {pinStatus.plain_pin && (
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {pinStatus?.plain_pin 
                  ? 'PIN is visible to admin. Reset to update.' 
                  : 'PIN was set by user and cannot be viewed. Reset to set a new one.'}
              </p>
            </div>

            {/* Reset PIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reset PIN</label>
              <div className="flex gap-2">
                <Input
                  type={showPin ? "text" : "password"}
                  placeholder="Enter new 4-digit PIN"
                  value={newPin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setNewPin(value);
                  }}
                  maxLength={4}
                  className="gold-border bg-secondary font-mono tracking-widest"
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a new 4-digit PIN to reset the user's PIN
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPinDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPin}
              disabled={pinLoading || newPin.length !== 4}
              className="bg-primary hover:bg-primary/90"
            >
              {pinLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Reset PIN
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
