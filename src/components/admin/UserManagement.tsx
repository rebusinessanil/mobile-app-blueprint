import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, Crown, User, Key, Eye, EyeOff, RefreshCw, Trash2, Mail, Phone, Shield } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface AuthUser {
  uid: string;
  email: string;
  phone: string;
  display_name: string;
  providers: string[];
  provider_type: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  rank: string | null;
  profile_photo: string | null;
  balance: number;
  total_earned: number;
  total_spent: number;
  is_admin: boolean;
  roles: string[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // PIN management state
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ has_pin: boolean; plain_pin: string | null } | null>(null);

  // Fetch users from Supabase Auth via edge function
  const fetchUsers = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list', page: 1, perPage: 1000 },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setUsers(data.users || []);
      console.log(`✅ Loaded ${data.users?.length || 0} users from Supabase Auth`);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscriptions for instant admin panel updates
    // Listen to profile changes to detect new users and updates
    const channel = supabase
      .channel('admin-auth-users-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('🔄 Admin: Profile changed, refreshing auth users', payload);
          fetchUsers();
        }
      )
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

    // Poll for auth changes every 10 seconds (since auth.users doesn't have realtime)
    const pollInterval = setInterval(() => {
      fetchUsers();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchUsers]);

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
        .eq('user_id', selectedUser.uid)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch credits: ${fetchError.message}`);
      }

      // If no record exists, create one
      if (!currentCredit) {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: selectedUser.uid,
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
          .eq('user_id', selectedUser.uid);

        if (updateError) {
          throw new Error(`Failed to update credits: ${updateError.message}`);
        }
      }

      // Log transaction
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.uid,
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
  const handleOpenPinDialog = async (user: AuthUser) => {
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
        body: { action: 'check_pin_status', target_user_id: user.uid },
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
        body: { action: 'reset_pin', target_user_id: selectedUser.uid, new_pin: newPin },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      
      // Update PIN status with the new PIN
      setPinStatus({ has_pin: true, plain_pin: data.plain_pin || newPin });
      toast.success("PIN reset successfully");
      setNewPin("");
      setShowPin(true);
    } catch (error: any) {
      console.error("Error resetting PIN:", error);
      toast.error(error.message || "Failed to reset PIN");
    } finally {
      setPinLoading(false);
    }
  };

  // Delete user from Supabase Auth
  const handleDeleteUser = async (user: AuthUser) => {
    if (!confirm(`Are you sure you want to delete ${user.display_name || user.email}? This will permanently remove them from Supabase Auth and all their data.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired");
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId: user.uid },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`User ${user.display_name || user.email} deleted successfully`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'email':
      default:
        return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalUsers = users.length;
  const totalCredits = users.reduce((sum, u) => sum + u.balance, 0);
  const adminCount = users.filter(u => u.is_admin).length;
  const today = new Date().toDateString();
  const newUsersToday = users.filter(u => new Date(u.created_at).toDateString() === today).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="gold-border bg-card rounded-xl p-4 animate-pulse">
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="gold-border bg-card rounded-2xl p-8">
          <div className="text-center text-muted-foreground">Loading users from Supabase Auth...</div>
        </div>
      </div>
    );
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
            placeholder="Search by name, email, phone or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 gold-border bg-secondary"
          />
        </div>
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
              <TableHead className="text-primary font-semibold">UID</TableHead>
              <TableHead className="text-primary font-semibold">Display Name</TableHead>
              <TableHead className="text-primary font-semibold">Email</TableHead>
              <TableHead className="text-primary font-semibold">Phone</TableHead>
              <TableHead className="text-primary font-semibold">Provider</TableHead>
              <TableHead className="text-primary font-semibold">Credits</TableHead>
              <TableHead className="text-primary font-semibold">Role</TableHead>
              <TableHead className="text-primary font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid} className="border-primary/10">
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate" title={user.uid}>
                  {user.uid.substring(0, 8)}...
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    {user.display_name || 'No Name'}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.phone ? (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {user.phone}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getProviderIcon(user.provider_type)}
                    <span className="text-xs capitalize">{user.provider_type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-primary">{user.balance}</span>
                </TableCell>
                <TableCell>
                  {user.is_admin ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:bg-secondary"
                      onClick={() => handleOpenPinDialog(user)}
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Credit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage Credits</DialogTitle>
            <DialogDescription>
              Adjust credits for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-bold text-primary">{selectedUser?.balance || 0}</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="gold-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleAdjustCredits('deduct')}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Minus className="w-4 h-4 mr-1" />
              Deduct
            </Button>
            <Button onClick={() => handleAdjustCredits('add')} className="gold-gradient text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" />
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Dialog */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage PIN</DialogTitle>
            <DialogDescription>
              Reset PIN for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pinLoading ? (
              <div className="text-center py-4 text-muted-foreground">Checking PIN status...</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">PIN Status:</span>
                  {pinStatus?.has_pin ? (
                    <Badge className="bg-green-500/20 text-green-500">PIN Set</Badge>
                  ) : (
                    <Badge variant="secondary">No PIN</Badge>
                  )}
                </div>
                {pinStatus?.plain_pin && (
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <span className="text-muted-foreground">Admin Reset PIN:</span>
                    <span className={`font-mono font-bold ${showPin ? 'text-primary' : 'blur-sm'}`}>
                      {pinStatus.plain_pin}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">New 4-digit PIN</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="gold-border font-mono text-center text-lg tracking-widest"
                    />
                    <Button 
                      onClick={handleResetPin} 
                      disabled={pinLoading || newPin.length !== 4}
                      className="gold-gradient text-primary-foreground"
                    >
                      Reset PIN
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}