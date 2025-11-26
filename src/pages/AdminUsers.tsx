import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Trash2, Edit, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/AdminGuard";

interface User {
  id: string;
  user_id: string;
  name: string;
  mobile: string; // Required field as per database schema
  whatsapp: string | null;
  rank: string | null;
  role: string | null;
  created_at: string;
}

interface UserCredits {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [credits, setCredits] = useState<Record<string, UserCredits>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    whatsapp: "",
    rank: "",
    role: "",
  });
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("*");

      if (creditsError) throw creditsError;

      const creditsMap = creditsData.reduce((acc, credit) => {
        acc[credit.user_id] = credit;
        return acc;
      }, {} as Record<string, UserCredits>);

      setUsers(usersData || []);
      setCredits(creditsMap);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      mobile: user.mobile,
      whatsapp: user.whatsapp || "",
      rank: user.rank || "",
      role: user.role || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(editForm)
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user: " + error.message);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    try {
      const amount = parseInt(creditAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      // Create credit transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: selectedUser.user_id,
          amount: amount,
          transaction_type: "admin_credit",
          description: "Credits added by admin",
        });

      if (transactionError) throw transactionError;

      // Update user credits
      const currentCredits = credits[selectedUser.user_id];
      const { error: updateError } = await supabase
        .from("user_credits")
        .update({
          balance: (currentCredits?.balance || 0) + amount,
          total_earned: (currentCredits?.total_earned || 0) + amount,
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      toast.success(`Added ${amount} credits successfully`);
      setCreditAmount("");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to add credits: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminGuard>
      <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, credits, and permissions
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, or WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold text-primary mt-2">{users.length}</p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {Object.values(credits).reduce((sum, c) => sum + c.balance, 0)}
            </p>
          </div>
          <div className="gold-border bg-card rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Active Today</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {users.filter(u => {
                const today = new Date().toDateString();
                return new Date(u.created_at).toDateString() === today;
              }).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="gold-border bg-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.mobile}</TableCell>
                    <TableCell>{user.whatsapp || "-"}</TableCell>
                    <TableCell>
                      {user.rank ? (
                        <Badge variant="outline">{user.rank}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        {credits[user.user_id]?.balance || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and manage credits
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={editForm.whatsapp}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label>Rank</Label>
                <Input
                  value={editForm.rank}
                  onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                />
              </div>
              <div>
                <Label>Add Credits</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                  <Button onClick={handleAddCredits}>Add</Button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
    </AdminGuard>
  );
}
