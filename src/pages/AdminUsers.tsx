import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Plus, Minus, Crown, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUserCard from "@/components/admin/AdminUserCard";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import GoldCoinLoader from "@/components/GoldCoinLoader";
import { useAdminUsersSync } from "@/hooks/useAdminRealtimeSync";

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

export default function AdminUsers() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [creditAmount, setCreditAmount] = useState("10");
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ has_pin: boolean; plain_pin: string | null } | null>(null);

  const fetchUsers = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list', page: 1, perPage: 1000 },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useAdminUsersSync(() => fetchUsers(), 15000);

  const handleAdjustCredits = async (action: 'add' | 'deduct') => {
    if (!selectedUser) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter valid amount"); return; }

    try {
      const { data: currentCredit } = await supabase.from('user_credits').select('balance, total_earned, total_spent').eq('user_id', selectedUser.uid).maybeSingle();

      if (!currentCredit) {
        await supabase.from('user_credits').insert({ user_id: selectedUser.uid, balance: action === 'add' ? amount : 0, total_earned: action === 'add' ? amount : 0, total_spent: 0 });
      } else {
        const newBalance = action === 'add' ? currentCredit.balance + amount : currentCredit.balance - amount;
        if (newBalance < 0) { toast.error("Insufficient balance"); return; }
        await supabase.from('user_credits').update({ balance: newBalance, total_earned: action === 'add' ? currentCredit.total_earned + amount : currentCredit.total_earned, total_spent: action === 'deduct' ? currentCredit.total_spent + amount : currentCredit.total_spent }).eq('user_id', selectedUser.uid);
      }

      await supabase.from('credit_transactions').insert({ user_id: selectedUser.uid, amount: action === 'add' ? amount : -amount, transaction_type: action === 'add' ? 'admin_credit' : 'spent', description: `Admin ${action}ed ₹${amount}` });
      toast.success(`Credits ${action}ed`);
      setIsCreditsDialogOpen(false);
      fetchUsers();
    } catch (error: any) { toast.error(error.message || "Failed"); }
  };

  const handleOpenPinDialog = async (user: AuthUser) => {
    setSelectedUser(user); setNewPin(""); setShowPin(false); setPinStatus(null); setIsPinDialogOpen(true); setPinLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.functions.invoke('admin-pin-management', { body: { action: 'check_pin_status', target_user_id: user.uid }, headers: { Authorization: `Bearer ${session.access_token}` } });
      setPinStatus(data);
    } catch { toast.error("Failed to check PIN"); } finally { setPinLoading(false); }
  };

  const handleResetPin = async () => {
    if (!selectedUser || newPin.length !== 4) return;
    setPinLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.functions.invoke('admin-pin-management', { body: { action: 'reset_pin', target_user_id: selectedUser.uid, new_pin: newPin }, headers: { Authorization: `Bearer ${session.access_token}` } });
      setPinStatus({ has_pin: true, plain_pin: data.plain_pin || newPin });
      toast.success("PIN reset"); setNewPin(""); setShowPin(true);
    } catch { toast.error("Failed to reset PIN"); } finally { setPinLoading(false); }
  };

  const handleDeleteUser = async (user: AuthUser) => {
    if (!confirm(`Delete ${user.display_name || user.email}?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke('admin-users', { body: { action: 'delete', userId: user.uid }, headers: { Authorization: `Bearer ${session.access_token}` } });
      toast.success("User deleted"); fetchUsers();
    } catch { toast.error("Failed to delete"); }
  };

  const filteredUsers = users.filter(u => u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalCredits = users.reduce((sum, u) => sum + u.balance, 0);
  const adminCount = users.filter(u => u.is_admin).length;
  const newToday = users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length;

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-[60vh]"><GoldCoinLoader size="lg" message="Loading..." /></div></AdminLayout>;

  return (
    <AdminLayout>
      <AdminHeader title="User Management" subtitle={`${users.length} users`} onRefresh={() => fetchUsers(true)} isRefreshing={refreshing} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AdminStatsCard icon={<User className="w-5 h-5" />} value={users.length} label="Total Users" />
          <AdminStatsCard icon={<Plus className="w-5 h-5" />} value={totalCredits} label="Total Credits" iconColor="text-green-500" />
          <AdminStatsCard icon={<Crown className="w-5 h-5" />} value={adminCount} label="Admins" />
          <AdminStatsCard icon={<User className="w-5 h-5" />} value={newToday} label="New Today" iconColor="text-blue-500" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card border-primary/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsers.map((user) => <AdminUserCard key={user.uid} user={user} onAdjustCredits={(u) => { setSelectedUser(u); setIsCreditsDialogOpen(true); }} onManagePin={handleOpenPinDialog} onDelete={handleDeleteUser} />)}
        </div>
      </div>

      <Dialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-sm"><DialogHeader><DialogTitle>Adjust Credits</DialogTitle><DialogDescription>{selectedUser?.display_name}</DialogDescription></DialogHeader>
          <div className="text-center py-2"><div className="text-3xl font-bold text-primary">{selectedUser?.balance || 0}</div></div>
          <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="text-center text-lg h-12" />
          <DialogFooter className="flex gap-2"><Button variant="outline" onClick={() => handleAdjustCredits('deduct')} className="flex-1 text-destructive"><Minus className="w-4 h-4 mr-1" />Deduct</Button><Button onClick={() => handleAdjustCredits('add')} className="flex-1"><Plus className="w-4 h-4 mr-1" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-sm"><DialogHeader><DialogTitle>PIN Management</DialogTitle></DialogHeader>
          {pinLoading ? <GoldCoinLoader size="sm" /> : <div className="space-y-4">
            <div className="p-3 bg-secondary/50 rounded-xl flex items-center gap-2">{pinStatus?.has_pin ? <><Badge className="bg-green-500/20 text-green-500">PIN Set</Badge>{showPin && pinStatus.plain_pin && <span className="font-mono">{pinStatus.plain_pin}</span>}<Button variant="ghost" size="icon" onClick={() => setShowPin(!showPin)}>{showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></> : <Badge variant="outline">No PIN</Badge>}</div>
            <Input maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="New 4-digit PIN" className="text-center text-xl tracking-widest" />
          </div>}
          <DialogFooter><Button onClick={handleResetPin} disabled={pinLoading || newPin.length !== 4} className="w-full">Reset PIN</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
